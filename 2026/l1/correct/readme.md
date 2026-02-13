### Role  
You are an expert front-end web developer with deep knowledge of vanilla JavaScript, browser-based ML using Transformers.js, and static site deployment. You always follow the given specifications exactly and write clean, well-structured, production-ready code.

***

### Context  
We need a fully client-side web application that can be hosted as static files (for example on GitHub Pages or Hugging Face Spaces). The app should:

- Load a local TSV file named `reviews_test.tsv` containing a `text` column with product reviews.  
- Use Papa Parse in the browser to parse the TSV into an array of review texts.  
- On button click, select a random review, display it, and classify its sentiment using Transformers.js with a supported sentiment model such as `Xenova/distilbert-base-uncased-finetuned-sst-2-english`. [github](https://github.com/huggingface/transformers.js/blob/main/docs/source/tutorials/next.md)
- Run all inference directly in the browser (no Hugging Face Inference API calls) to avoid CORS issues and ensure the app remains purely static. [huggingface](https://huggingface.co/docs/transformers.js/index)

The UI should show:

- A text area containing the randomly selected review.  
- A sentiment/emotion result with a label (e.g., POSITIVE/NEGATIVE/NEUTRAL) and confidence score.  
- An icon indicating positive (thumbs up), negative (thumbs down), or neutral (question mark).  
- Loading and error states (e.g., while the model is loading or when TSV parsing fails).

***

### Instructions  

Implement the web app with the following exact requirements:

1. **File structure**  
   - Create exactly two files: `index.html` and `app.js`.  
   - `index.html` must contain the full HTML structure, inline CSS for basic styling, and script tags for external libraries.  
   - `app.js` must contain all JavaScript logic.  
   - Load `app.js` from `index.html` with a `<script type="module" src="app.js"></script>` tag so ES module imports are allowed.

2. **Libraries and CDNs**  
   In `index.html`, include:  
   - **Papa Parse** via CDN for TSV parsing:  
     - `<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>`  
   - **Font Awesome** for sentiment icons:  
     - `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">`  
   - **Transformers.js** will be imported as an ES module from within `app.js` using:  
     - `import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js";` [huggingface](https://huggingface.co/docs/transformers.js/en/index)

3. **TSV loading and parsing (app.js)**  
   - Use `fetch("reviews_test.tsv")` to load the TSV file.  
   - Use Papa Parse with `header: true` and `delimiter: "\t"` to parse it. [papaparse](https://www.papaparse.com)
   - Extract an array of clean review texts from the `text` column, filtering out empty or non-string values.  
   - Handle network and parsing errors gracefully and show a user-friendly message in the UI.

4. **Model initialization with Transformers.js**  
   - In `app.js`, import `pipeline` from Transformers.js as an ES module.  
   - On startup (`DOMContentLoaded`), create a **single shared pipeline** for sentiment analysis or text classification:  
     - Example:  
       - `const sentimentPipeline = await pipeline("text-classification", "Xenova/distilbert-base-uncased-finetuned-sst-2-english");` [huggingface](https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-sst-2-english)
   - Display a status message while the model is downloading/loading (e.g., “Loading sentiment model…”), and another when it is ready (e.g., “Sentiment model ready”).  
   - If model loading fails, log the error and show a readable error message in the UI.

5. **User interaction and sentiment analysis flow**  
   - Add a button labeled “Analyze random review”.  
   - When clicked:  
     - If no reviews are loaded, show an error message and do nothing else.  
     - Randomly select one review from the parsed list.  
     - Display the selected review in a dedicated element.  
     - Show a loading indicator and disable the button while analysis is running.  
     - Call the Transformers.js pipeline with the review text.  
       - The pipeline will return an array like `[{ label: "POSITIVE", score: 0.99 }, ...]`. [huggingface](https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-sst-2-english)
     - Normalize this output into a structure that your display function can easily consume (e.g., choose the top result, or wrap as `[[{label, score}]]` if helpful).  
     - Map the `label` and `score` to one of three sentiment buckets: positive, negative, or neutral.  
       - Positive if label is `"POSITIVE"` and score > 0.5.  
       - Negative if label is `"NEGATIVE"` and score > 0.5.  
       - Neutral in all other cases.  
     - Update the UI with the label, confidence percentage, and the corresponding icon.  
     - Re-enable the button and hide the loading indicator when done.

6. **UI and styling details**  
   - The UI should include at minimum:  
     - A title for the page.  
     - A section showing the selected review text (use a `<div>` or `<p>`).  
     - A result area that shows:  
       - The sentiment label and confidence (e.g., “POSITIVE (98.7% confidence)”).  
       - A Font Awesome icon:  
         - Positive → `fa-thumbs-up`  
         - Negative → `fa-thumbs-down`  
         - Neutral → `fa-question-circle`  
     - A status text area for model loading messages.  
     - An error message area that is hidden by default and shown only when needed.  
   - Add simple, clear CSS to make the layout readable and visually distinct (e.g., different colors for positive/negative/neutral).

7. **Error handling**  
   - Handle and surface errors for:  
     - TSV load failures (network, 404).  
     - TSV parsing failures.  
     - Model loading failures.  
     - Inference failures (e.g., invalid output).  
   - Do not crash silently; log errors to the console and update the error message area with a user-friendly explanation.  
   - Always clear previous error messages when starting a new analysis.

8. **Technical constraints**  
   - Use only vanilla JavaScript; no frameworks or bundlers (no React, Vue, etc.).  
   - The app must run entirely in the browser with no server-side code or custom backend.  
   - Do not call the Hugging Face Inference API or Router; all inference must go through Transformers.js running locally in the browser. [github](https://github.com/huggingface/transformers.js)

9. **Code quality**  
   - Organize `app.js` into small, well-named functions for loading reviews, initializing the model, running analysis, displaying results, and handling errors.  
   - Use clear, concise comments in English explaining key logic, especially around model loading and sentiment mapping.  
   - Avoid global leaks other than the minimal necessary variables.

***

### Format  

Return your answer in this exact structure:

1. A complete `index.html` file in a fenced code block labeled `html`.  
   - Must include:  
     - Full HTML skeleton (`<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`).  
     - CSS styling (inline in a `<style>` tag is acceptable).  
     - Papa Parse and Font Awesome CDNs.  
     - The UI elements described above.  
     - `<script type="module" src="app.js"></script>` at the end of the body.  

2. A complete `app.js` file in a separate fenced code block labeled `javascript`.  
   - Must include:  
     - The `import { pipeline } from "https://cdn.jsdelivr.net/.../transformers.min.js";` statement.  
     - All logic for TSV loading, model initialization, random review selection, sentiment analysis with Transformers.js, UI updates, and error handling.  

3. Do not include any extra explanation or commentary outside these two code blocks.
