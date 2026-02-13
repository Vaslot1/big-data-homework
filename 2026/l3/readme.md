# Assignment: AI-Driven Decision System (From Insight to Action)

## 📌 Overview
Last week, we successfully connected the Hugging Face API to collect and log sentiment data. You built a **Sensor** that detects customer mood.

This week, we will upgrade that sensor into a **Brain**. In a real-world business context, knowing a customer is angry is useless unless you *do* something about it. Your task is to implement an **Automated Decision Logic** that triggers specific business actions based on the AI's analysis.

## 🎯 Objectives
1.  **Business Logic Implementation:** Translate raw AI probability scores into actionable business rules.
2.  **Dynamic UI/UX:** Update the frontend to reflect the system's decision in real-time.
3.  **Action Logging:** Log not just the *sentiment*, but the *action taken* to Google Sheets for future ROI analysis.

---

## 🏢 The Scenario: "The Automatic Firefighter"
You are building the CRM system for an e-commerce platform. Management wants to automate customer service responses.

*   **If a customer is furious (High Negative Risk):** We must apologize immediately and offer a discount to prevent churn.
*   **If a customer is vague (Neutral):** We need more data. Ask for specific feedback.
*   **If a customer is happy (High Positive):** Capitalize on the moment. Ask them to refer a friend.

---

## 🛠️ Task Specifications

### 1. The Logic Matrix
You must implement the following logic. Note that Hugging Face usually returns a `label` (POSITIVE/NEGATIVE) and a `score` (confidence). You need to normalize this into a single "Positivity Index" or handle the conditional logic carefully.

| AI Outcome (Label / Conf) | Normalized Score (0~1) | Business Risk | **Automated Action** | **UI Response** |
| :--- | :--- | :--- | :--- | :--- |
| **NEGATIVE** (High Conf) | $0.0 \le S \le 0.4$ | **Churn Risk** | `OFFER_COUPON` | 🚨 Show Apology & **50% Off Coupon Button** |
| **NEUTRAL** / Low Conf | $0.4 < S < 0.7$ | **Uncertain** | `REQUEST_FEEDBACK` | 📝 Show **Detailed Survey Link** |
| **POSITIVE** (High Conf) | $0.7 \le S \le 1.0$ | **Loyal** | `ASK_REFERRAL` | ⭐ Show **"Refer a Friend" Button** |

### 2. Implementation Steps

#### Step A: Logic Function
Write a function `determineBusinessAction(score, label)` that returns the Action Code, UI Message, and Color.

#### Step B: UI Update
Modify your HTML/JS so that after the API responds, a new section (e.g., `<div id="action-result">`) appears displaying the correct message and style defined in your logic.

#### Step C: Enhanced Logging
Update your Google Sheets App Script and Frontend code to send an extra column:
*   **Old Columns:** `timestamp`, `review`, `sentiment`, `confidence`
*   **New Column:** **`action_taken`** (e.g., "OFFER_COUPON")

---

## 💻 Starter Code Snippet

Use this logic function as a baseline for your implementation. You need to integrate this into your existing `script.js`.

```javascript
/**
 * Determines the appropriate business action based on sentiment analysis results.
 * 
 * Normalizes the AI output into a linear scale (0.0 to 1.0) to simplify
 * threshold comparisons.
 * 
 * @param {number} confidence - The confidence score returned by the API (0.0 to 1.0).
 * @param {string} label - The label returned by the API (e.g., "POSITIVE", "NEGATIVE").
 * @returns {object} An object containing the action metadata (code, message, color).
 */
function determineBusinessAction(confidence, label) {
    // 1. Normalize Score: Map everything to a 0 (Worst) to 1 (Best) scale.
    // If Label is NEGATIVE, a high confidence means a VERY BAD score (near 0).
    let normalizedScore = 0.5; // Default neutral

    if (label === "POSITIVE") {
        normalizedScore = confidence; // e.g., 0.9 -> 0.9 (Great)
    } else if (label === "NEGATIVE") {
        normalizedScore = 1.0 - confidence; // e.g., 0.9 conf -> 0.1 (Terrible)
    }

    // 2. Apply Business Thresholds
    if (normalizedScore <= 0.4) {
        // CASE: Critical Churn Risk
        return {
            actionCode: "OFFER_COUPON",
            uiMessage: "We are truly sorry. Please accept this 50% discount coupon.",
            uiColor: "#ef4444" // Red
        };
    } else if (normalizedScore < 0.7) {
        // CASE: Ambiguous / Neutral
        return {
            actionCode: "REQUEST_FEEDBACK",
            uiMessage: "Thank you! Could you tell us how we can improve?",
            uiColor: "#6b7280" // Gray
        };
    } else {
        // CASE: Happy Customer
        return {
            actionCode: "ASK_REFERRAL",
            uiMessage: "Glad you liked it! Refer a friend and earn rewards.",
            uiColor: "#3b82f6" // Blue
        };
    }
}

// Usage Example inside your API callback:
// const decision = determineBusinessAction(result.score, result.label);
// console.log("System Decision:", decision.actionCode);
// updateDOM(decision); 
// logToGoogleSheet(..., decision.actionCode);
```

---

## 📤 Requirements

1.  **Deploy** your updated web page (GitHub Pages).
2.  **Screen** of your Google Sheet showing the new `action_taken` column populated with different actions ("OFFER_COUPON", "ASK_REFERRAL", etc.).

## 💡 Evaluation Criteria
*   **Logic Accuracy:** Does a negative review actually trigger the coupon logic?
*   **UI Feedback:** Does the user *see* the result of the logic? (Not just console logs).
*   **Data Integrity:** Is the `action_taken` correctly logged in the database (Sheets)?

---

## 📋 Google Sheets Apps Script

Copy this code to your Google Sheets Apps Script (Extensions → Apps Script):

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Add headers if first row is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['timestamp', 'review', 'sentiment', 'confidence', 'action_taken']);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp,
      data.review,
      data.sentiment,
      data.confidence,
      data.action_taken
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Deployment Steps:
1. Create a new Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete any existing code and paste the code above
4. Click **Deploy → New deployment**
5. Choose **Web app** as type
6. Set "Who has access" to **Anyone**
7. Click **Deploy** and copy the Web App URL
8. Paste the URL in your app's "Google Sheets Web App URL" field
