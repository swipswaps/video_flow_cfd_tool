
import { GoogleGenAI, Type } from "@google/genai";
import type { Vector, OpenFoamFileSet } from '../types';
import { GRID_WIDTH, GRID_HEIGHT, GEMINI_MODEL } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Extracts frames from a video clip as base64 strings.
 */
async function extractFrames(
    videoElement: HTMLVideoElement,
    startTime: number,
    endTime: number,
    updateStatus: (message: string) => void
): Promise<string[]> {
    updateStatus('Extracting frames from video...');
    return new Promise((resolve, reject) => {
        const frames: string[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));

        videoElement.currentTime = startTime;

        const onSeeked = () => {
            if (videoElement.currentTime >= endTime) {
                videoElement.removeEventListener('seeked', onSeeked);
                resolve(frames);
                return;
            }

            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            // Get base64 string, remove data URL prefix
            const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            frames.push(frameData);
            
            updateStatus(`Extracted frame ${frames.length}...`);
            
            // Seek to the next frame (assuming 30fps for reasonable sampling)
            videoElement.currentTime += 1/30;
        };

        videoElement.addEventListener('seeked', onSeeked);
        
        // Kick off the process
        videoElement.currentTime = startTime;
    });
}

/**
 * Calls Gemini API to calculate the optical flow between two frames.
 */
async function calculateVectorField(frame1_base64: string, frame2_base64: string): Promise<Vector[][]> {
    const prompt = `You are an expert in fluid dynamics and computer vision. Your task is to perform an optical flow analysis on the two provided, consecutive video frames to estimate the 2D velocity field of the fluid. Analyze the motion from the first image to the second. Provide the output as a velocity vector field on a ${GRID_WIDTH}x${GRID_HEIGHT} grid. The final output must be a single JSON object matching the provided schema. The 'vectors' array should contain exactly ${GRID_WIDTH * GRID_HEIGHT} elements in row-major order, representing the grid from top-left to bottom-right.`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            vectors: {
                type: Type.ARRAY,
                description: `An array of exactly ${GRID_WIDTH * GRID_HEIGHT} velocity vectors.`,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        u: { type: Type.NUMBER, description: "Velocity component in the x-direction" },
                        v: { type: Type.NUMBER, description: "Velocity component in the y-direction" }
                    },
                    required: ["u", "v"]
                }
            }
        },
        required: ["vectors"]
    };

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { mimeType: 'image/jpeg', data: frame1_base64 } },
                { inlineData: { mimeType: 'image/jpeg', data: frame2_base64 } }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        }
    });

    const jsonText = response.text;
    const result = JSON.parse(jsonText);
    const flatVectors: Vector[] = result.vectors;

    if (flatVectors.length !== GRID_WIDTH * GRID_HEIGHT) {
        throw new Error(`AI returned an incorrect number of vectors. Expected ${GRID_WIDTH * GRID_HEIGHT}, got ${flatVectors.length}.`);
    }
    
    const grid: Vector[][] = [];
    for (let i = 0; i < GRID_HEIGHT; i++) {
        grid.push(flatVectors.slice(i * GRID_WIDTH, (i + 1) * GRID_WIDTH));
    }
    return grid;
}

/**
 * Generates OpenFOAM compatible file contents.
 */
function generateOpenFoamFiles(vectorField: Vector[][], duration: number): OpenFoamFileSet {
    const header = `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/`;

    const numPoints = GRID_WIDTH * GRID_HEIGHT;
    let vectorList = '';
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const vec = vectorField[y][x];
            // OpenFOAM is 3D, so we add a 0 for the z-component
            vectorList += `(${vec.u.toFixed(6)} ${vec.v.toFixed(6)} 0)\n`;
        }
    }

    const U = `${header}
FoamFile
{
    version     2.0;
    format      ascii;
    class       volVectorField;
    location    "0";
    object      U;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 1 -1 0 0 0 0];

internalField   nonuniform List<vector> 
${numPoints}
(
${vectorList}
);

boundaryField
{
    walls
    {
        type            zeroGradient;
    }
    inlet
    {
        type            zeroGradient;
    }
    outlet
    {
        type            zeroGradient;
    }
}
`;

    const controlDict = `${header}
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "system";
    object      controlDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     icoFoam;
startFrom       startTime;
startTime       0;
stopAt          endTime;
endTime         ${duration.toFixed(2)};
deltaT          0.005;
writeControl    timeStep;
writeInterval   20;
purgeWrite      0;
writeFormat     ascii;
writePrecision  6;
writeCompression off;
timeFormat      general;
timePrecision   6;
runTimeModifiable true;
`;

    const fvSchemes = `${header}
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "system";
    object      fvSchemes;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

ddtSchemes
{
    default         Euler;
}

gradSchemes
{
    default         Gauss linear;
}

divSchemes
{
    default         none;
    div(phi,U)      Gauss linear;
}

laplacianSchemes
{
    default         Gauss linear orthogonal;
}

interpolationSchemes
{
    default         linear;
}

snGradSchemes
{
    default         orthogonal;
}
`;

    const fvSolution = `${header}
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "system";
    object      fvSolution;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

solvers
{
    p
    {
        solver          PCG;
        preconditioner  DIC;
        tolerance       1e-06;
        relTol          0.05;
    }

    U
    {
        solver          smoothSolver;
        smoother        symGaussSeidel;
        tolerance       1e-05;
        relTol          0;
    }
}

PISO
{
    nCorrectors     2;
    nNonOrthogonalCorrectors 0;
    pRefCell        0;
    pRefValue       0;
}
`;

    const transportProperties = `${header}
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    location    "constant";
    object      transportProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

nu              [0 2 -1 0 0 0 0] 0.01;
`;

    return { U, controlDict, fvSchemes, fvSolution, transportProperties };
}


/**
 * Main orchestration function.
 */
export async function calculateFlowAndGenerateFiles(
    videoElement: HTMLVideoElement,
    startTime: number,
    endTime: number,
    updateStatus: (message: string) => void
): Promise<{ vectorField: Vector[][]; openFoamFiles: OpenFoamFileSet; previewFrame: string; }> {
    const frames = await extractFrames(videoElement, startTime, endTime, updateStatus);
    
    if (frames.length < 2) {
        throw new Error('Not enough frames extracted to perform analysis. Please select a longer clip.');
    }
    
    updateStatus(`Analyzing ${frames.length - 1} frame pairs with AI...`);

    const vectorFields: Vector[][][] = [];
    for (let i = 0; i < frames.length - 1; i++) {
        updateStatus(`Analyzing frame pair ${i + 1}/${frames.length - 1}...`);
        const vf = await calculateVectorField(frames[i], frames[i + 1]);
        vectorFields.push(vf);
    }

    updateStatus('Averaging vector fields...');
    const averagedField: Vector[][] = Array(GRID_HEIGHT).fill(0).map(() => Array(GRID_WIDTH).fill({ u: 0, v: 0 }));

    for (const field of vectorFields) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                averagedField[y][x] = {
                    u: averagedField[y][x].u + field[y][x].u,
                    v: averagedField[y][x].v + field[y][x].v,
                };
            }
        }
    }
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            averagedField[y][x] = {
                u: averagedField[y][x].u / vectorFields.length,
                v: averagedField[y][x].v / vectorFields.length,
            };
        }
    }

    updateStatus('Generating OpenFOAM files...');
    const openFoamFiles = generateOpenFoamFiles(averagedField, endTime - startTime);
    
    updateStatus('Finalizing results...');

    return {
        vectorField: averagedField,
        openFoamFiles,
        previewFrame: `data:image/jpeg;base64,${frames[0]}`,
    };
}
