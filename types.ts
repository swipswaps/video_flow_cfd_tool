
export interface Vector {
    u: number; // velocity in x
    v: number; // velocity in y
}

export type OpenFoamFileSet = {
    U: string;
    controlDict: string;
    fvSchemes: string;
    fvSolution: string;
    transportProperties: string;
};
