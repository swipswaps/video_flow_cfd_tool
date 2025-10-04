# CFD Flow Visualizer

The CFD Flow Visualizer is an advanced engineering tool designed to analyze fluid motion from standard video files. Leveraging the power of the Gemini AI, it performs optical flow estimation to generate a 2D velocity vector field. The results are presented as an interactive quiver plot and as initial condition files compatible with the widely-used OpenFOAM computational fluid dynamics software package.

This tool is perfect for engineers, students, and researchers who need a quick and intuitive way to get initial CFD simulation data from real-world visual sources.

![CFD Flow Visualizer Screenshot](https://storage.googleapis.com/aistudio-hosting/workspace-storage/e6615b3c-6232-474c-ac94-9fd6168e309f/readme_screenshot.png)

## Key Features

- **Flexible Video Loading**: Load video files directly from your device or from a web URL.
- **Intuitive Video Trimming**: Easily select a clip of up to 5 seconds for analysis using interactive sliders.
- **AI-Powered Flow Analysis**: Utilizes a sophisticated AI model to analyze frame-by-frame motion and calculate a detailed velocity vector field.
- **Interactive Visualization**:
    - **Quiver Plot**: Displays the velocity field with arrows representing flow direction and magnitude.
    - **Dynamic Controls**: Adjust vector density and arrow scale in real-time to tailor the visualization.
    - **Color-Coded Magnitude**: Velocity vectors are colored on a gradient from blue (low) to red (high) for at-a-glance magnitude interpretation, complete with a clear legend.
- **OpenFOAM File Generation**: Automatically creates a full set of initial condition files (`U`, `controlDict`, `fvSchemes`, `fvSolution`, `transportProperties`) ready for use in a CFD simulation.

---

## User Guide

Follow these steps to analyze your video and generate CFD data.

### 1. Load Your Video

You have two options for loading a video:

- **Upload from Device**: Click the "Upload from Device" button to open a file dialog and select a video file from your computer.
- **Load from URL**: Paste the URL of a video file into the input box and click the link icon. (Note: This may be affected by the remote server's CORS policy).

### 2. Trim Clip & Calculate

Once your video is loaded, a player and trimming controls will appear.

1.  **Select a Clip**: Use the "Start Time" and "End Time" sliders to define the segment of the video you want to analyze. The selected region will be highlighted on the main timeline.
2.  **Check Duration**: The "Clip Duration" display shows the length of your selected clip. It must be greater than 0 and no more than 5 seconds. The display will be green if the duration is valid.
3.  **Start Analysis**: Click the **"Calculate Flow Field"** button. The process will begin, and a status indicator will show the current stage (e.g., "Extracting frames...", "Analyzing with AI...").

### 3. Analyze the Results

After the calculation is complete, the results will be displayed in a tabbed interface.

- **Flow Visualization Tab**: This tab shows the interactive quiver plot overlaid on the first frame of your clip.
    - **Adjust Density**: Use the "Vector Density" slider to control how many vectors are displayed on the grid.
    - **Adjust Scale**: Use the "Arrow Scale" slider to change the length of the vectors for better visibility.
    - **Interpret Colors**: The color of each arrow corresponds to its velocity magnitude, as indicated by the legend in the bottom-right corner.

- **OpenFOAM File Tabs**:
    - Click on any of the other tabs (`U`, `controlDict`, etc.) to view the contents of the generated OpenFOAM files.
    - Click the **"Copy"** button in the top-right corner of the text area to copy the entire file content to your clipboard, ready to be pasted into your CFD case directory.

---

## Troubleshooting

If you encounter issues, consult the tips below.

| Issue                                           | Cause & Solution                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Remote video URL won't load.**                | This is likely due to a **CORS (Cross-Origin Resource Sharing) policy** on the server hosting the video, which prevents this web application from accessing it. <br/> **Solution**: Download the video to your device and use the "Upload from Device" option instead.                                                                                                |
| **Error: "Not enough frames extracted."**       | This error occurs if the selected clip is too short or has a very low frame rate, resulting in fewer than two frames being captured for analysis. <br/> **Solution**: Increase the duration of the selected clip by adjusting the "End Time" slider.                                                                                                                   |
| **Calculation fails or takes a very long time.**| The analysis relies on the Gemini API. Failure can be caused by network issues, a disabled API key, or if the video frames are too complex, dark, or blurry for the AI to process. <br/> **Solutions**: <br/> 1. Check your internet connection. <br/> 2. Open the browser's developer console (`F12` or `Cmd+Opt+I`) to check for specific error messages. <br/> 3. Try a different, clearer video clip with more distinct motion. |
| **The visualization has no vectors or looks wrong.** | This can happen if the AI detects no discernible motion between the video frames (e.g., a static scene). Chaotic vectors might result from rapid, complex motion or video compression artifacts. <br/> **Solutions**: <br/> 1. Choose a video segment with clear, steady fluid-like motion. <br/> 2. Adjust the **Vector Density** and **Arrow Scale** sliders to see if it makes the flow pattern clearer.               |
| **The app is unresponsive.**                    | Some operations, like frame extraction and AI analysis, are computationally intensive and can temporarily make the browser less responsive, especially on lower-end devices. <br/> **Solution**: Please be patient while the calculation is in progress. Avoid clicking buttons multiple times.                                                                       |
