## Role  
You are an expert front-end web developer specialized in building static web applications with HTML, CSS, and vanilla JavaScript. You always follow all given specifications exactly, without omission, simplification, or unrequested changes.

***

## Context  
We want a fully client-side sentiment analysis web app that can be deployed on GitHub Pages. The app should load random product reviews from a local TSV file, send the selected review text to the Hugging Face Inference API, and visually display the sentiment result.  
The sentiment model to use is explicitly `siebert/sentiment-roberta-large-english` from Hugging Face for English sentiment classification. [huggingface](https://huggingface.co/siebert/sentiment-roberta-large-english)

***

## Instruction  

Implement the web app with the following exact requirements:

### 1. File structure  
- Create exactly two files: `index.html` (UI, structure, and styles) and `app.js` (all JavaScript logic).  
- Do not inline or merge JavaScript into `index.html`. All logic must live in `app.js`.  
- `index.html` must load `app.js` via `<script src="app.js"></script>` at the end of the body.

### 2. Libraries and CDNs  
In `index.html`, include the following CDNs:

- Papa Parse (for TSV parsing):  
  - `<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>`  
- Font Awesome (for icons):  
  - `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">`  

No other third-party JS frameworks (e.g., React, Vue) are allowed.

### 3. Data handling (TSV)  
- Use `fetch` to load a local file named `reviews_test.tsv`.  
- Use Papa Parse **only** to parse this file as TSV (tab-separated), assuming it has a column named `text` that contains the review text.  
- Do not manually split strings, use `String.split`, or implement any custom parsing logic for the TSV. All parsing must go through Papa Parse.  
- After parsing, build and store an in-memory array of review texts that can be randomly sampled later.

### 4. User interface  
Design the UI in `index.html` so that it provides:

- An input field where the user can (optionally) enter a Hugging Face API token (plain text, not obscured, is acceptable).  
- A button to trigger the action: “Analyze random review”.  
- A display area with:
  - The randomly selected review text.  
  - The sentiment result (textual label and an icon).  
  - A place to show user-friendly error messages (e.g., when API or network fails).

Style is up to you, but the layout must make these elements clearly visible and easy to understand.

### 5. Sentiment model and API call  
Implement the sentiment analysis as follows:

- When the “Analyze random review” button is clicked:
  - Randomly select one review text from the parsed TSV data.  
  - Display the selected review text in the UI.  
  - Call the Hugging Face Inference API with a POST request to:  
    - `https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english` [github](https://github.com/huggingface/hub-docs/blob/main/docs/api-inference/getting-started.md)
  - The request body must be JSON of the form:  
    - `{ "inputs": reviewText }`  
  - If the user has provided a token in the input field, include this HTTP header:  
    - `Authorization: Bearer <USER_TOKEN>`  
  - If the token field is empty, omit the `Authorization` header and call the API as an anonymous/free-tier request.

### 6. Response parsing and sentiment logic  
- Assume the API returns a JSON response compatible with Hugging Face text-classification API, e.g.: [github](https://github.com/huggingface/hub-docs/blob/main/docs/api-inference/tasks/text-classification.md)
  - `[[{ "label": "POSITIVE", "score": number }, { "label": "NEGATIVE", "score": number }]]` or similar.  
- Parse the response and determine the **final sentiment** using the following rules:
  - If the predicted label is `"POSITIVE"` and its `score` is greater than `0.5`, classify the review as positive.  
  - If the predicted label is `"NEGATIVE"` and its `score` is greater than `0.5`, classify the review as negative.  
  - In all other cases (e.g., low scores, unexpected response), classify as neutral.  
- Use Font Awesome icons for the final sentiment:
  - Positive → thumbs-up icon (e.g., `<i class="fa-solid fa-thumbs-up"></i>`).  
  - Negative → thumbs-down icon.  
  - Neutral → question mark icon.

### 7. Error handling  
Implement robust, user-friendly error handling:

- Handle errors when:
  - Fetching `reviews_test.tsv` fails (network error, file not found, etc.).  
  - Papa Parse fails or the parsed data does not contain a `text` column.  
  - The Hugging Face API returns errors (non-2xx status codes, invalid token, rate limiting, model loading, etc.).  
  - The response has an unexpected format.  
- In all error cases:
  - Do not crash the app.  
  - Show a readable error message in the designated error area in the UI (e.g., “Failed to load reviews. Please check that reviews_test.tsv is available.”).

### 8. Technical constraints  
- Use **only** vanilla JavaScript; do not use any JS frameworks or bundlers.  
- The app must be fully static and run entirely in the browser (no server-side logic).  
- The resulting files should be directly deployable on GitHub Pages.  
- Keep all JavaScript logic inside `app.js`; only structural markup, styling, and CDN/script tags go in `index.html`.

***

## Format  

Return the final answer in **three parts**, in this exact order:

1. A Markdown code block containing the **complete `index.html`** file.  
   - This file must include:
     - Full HTML skeleton.  
     - Link tags for Font Awesome.  
     - Script tag for Papa Parse CDN.  
     - The UI elements described above.  
     - A `<script src="app.js"></script>` tag at the bottom of the body.  
2. A separate Markdown code block containing the **complete `app.js`** file.  
   - This file must contain:
     - All logic for loading and parsing the TSV file with Papa Parse.  
     - The event handling for the button.  
     - The logic to call the Hugging Face API, parse the response, map to sentiment, and update the UI.  
     - Graceful error handling.  
3. After the two code blocks, provide **detailed explanations** of the implementation choices and flow (in natural language), and ensure that the **code itself** includes clear, concise comments in English explaining the key parts of the logic and any non-trivial steps.
