let reviews = [];
let apiToken = '';
let sheetsUrl = '';

const analyzeBtn = document.getElementById('analyze-btn');
const reviewText = document.getElementById('review-text');
const sentimentResult = document.getElementById('sentiment-result');
const loadingElement = document.querySelector('.loading');
const errorElement = document.getElementById('error-message');
const apiTokenInput = document.getElementById('api-token');
const sheetsUrlInput = document.getElementById('sheets-url');
const actionResult = document.getElementById('action-result');
const logStatus = document.getElementById('log-status');

document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    
    analyzeBtn.addEventListener('click', analyzeRandomReview);
    apiTokenInput.addEventListener('change', saveApiToken);
    sheetsUrlInput.addEventListener('change', saveSheetsUrl);
    
    const savedToken = localStorage.getItem('hfApiToken');
    if (savedToken) {
        apiTokenInput.value = savedToken;
        apiToken = savedToken;
    }
    
    const savedSheetsUrl = localStorage.getItem('sheetsUrl');
    if (savedSheetsUrl) {
        sheetsUrlInput.value = savedSheetsUrl;
        sheetsUrl = savedSheetsUrl;
    }
});

function loadReviews() {
    fetch('reviews_test.tsv')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load TSV file');
            return response.text();
        })
        .then(tsvData => {
            Papa.parse(tsvData, {
                header: true,
                delimiter: '\t',
                complete: (results) => {
                    reviews = results.data
                        .map(row => row.text)
                        .filter(text => text && text.trim() !== '');
                    console.log('Loaded', reviews.length, 'reviews');
                },
                error: (error) => {
                    console.error('TSV parse error:', error);
                    showError('Failed to parse TSV file: ' + error.message);
                }
            });
        })
        .catch(error => {
            console.error('TSV load error:', error);
            showError('Failed to load TSV file: ' + error.message);
        });
}

function saveApiToken() {
    apiToken = apiTokenInput.value.trim();
    if (apiToken) {
        localStorage.setItem('hfApiToken', apiToken);
    } else {
        localStorage.removeItem('hfApiToken');
    }
}

function saveSheetsUrl() {
    sheetsUrl = sheetsUrlInput.value.trim();
    if (sheetsUrl) {
        localStorage.setItem('sheetsUrl', sheetsUrl);
    } else {
        localStorage.removeItem('sheetsUrl');
    }
}

function determineBusinessAction(confidence, label) {
    let normalizedScore = 0.5;
    
    if (label === "POSITIVE") {
        normalizedScore = confidence;
    } else if (label === "NEGATIVE") {
        normalizedScore = 1.0 - confidence;
    }
    
    if (normalizedScore <= 0.4) {
        return {
            actionCode: "OFFER_COUPON",
            uiMessage: "We are truly sorry for your experience. Please accept this 50% discount coupon on your next purchase.",
            uiColor: "#ef4444",
            uiIcon: "fa-gift",
            uiTitle: "Special Offer For You",
            buttonText: "Claim 50% Off"
        };
    } else if (normalizedScore < 0.7) {
        return {
            actionCode: "REQUEST_FEEDBACK",
            uiMessage: "Thank you for your feedback! Could you tell us more about how we can improve your experience?",
            uiColor: "#6b7280",
            uiIcon: "fa-comment-dots",
            uiTitle: "We'd Love Your Input",
            buttonText: "Share Details"
        };
    } else {
        return {
            actionCode: "ASK_REFERRAL",
            uiMessage: "We're so glad you enjoyed your experience! Refer a friend and you'll both get special rewards.",
            uiColor: "#3b82f6",
            uiIcon: "fa-user-plus",
            uiTitle: "Share the Love",
            buttonText: "Refer a Friend"
        };
    }
}

function displayAction(decision) {
    actionResult.className = 'action-result show';
    
    if (decision.actionCode === "OFFER_COUPON") {
        actionResult.classList.add('action-coupon');
    } else if (decision.actionCode === "REQUEST_FEEDBACK") {
        actionResult.classList.add('action-feedback');
    } else {
        actionResult.classList.add('action-referral');
    }
    
    document.getElementById('action-title').textContent = decision.uiTitle;
    document.getElementById('action-message').textContent = decision.uiMessage;
    
    const actionIcon = actionResult.querySelector('.action-icon');
    actionIcon.innerHTML = `<i class="fas ${decision.uiIcon}"></i>`;
    
    const actionButton = document.getElementById('action-button');
    actionButton.textContent = decision.buttonText;
    actionButton.onclick = () => {
        alert(`Action: ${decision.actionCode}\n\nThis would trigger the ${decision.buttonText} flow in a real application.`);
    };
}

function hideAction() {
    actionResult.className = 'action-result';
    actionResult.classList.remove('action-coupon', 'action-feedback', 'action-referral');
}

function analyzeRandomReview() {
    hideError();
    hideAction();
    logStatus.className = 'log-status';
    logStatus.textContent = '';
    
    if (!apiToken) {
        showError('Please enter your Hugging Face API token. The API requires authentication for CORS support.');
        return;
    }
    
    if (reviews.length === 0) {
        showError('No reviews available. Please try again later.');
        return;
    }
    
    const selectedReview = reviews[Math.floor(Math.random() * reviews.length)];
    reviewText.textContent = selectedReview;
    
    loadingElement.style.display = 'block';
    analyzeBtn.disabled = true;
    sentimentResult.innerHTML = '';
    sentimentResult.className = 'sentiment-result';
    
    analyzeSentiment(selectedReview)
        .then(result => {
            const { sentiment, label, score } = displaySentiment(result);
            const decision = determineBusinessAction(score, label);
            displayAction(decision);
            
            if (sheetsUrl) {
                logToGoogleSheets(selectedReview, label, score, decision.actionCode);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to analyze sentiment: ' + error.message);
        })
        .finally(() => {
            loadingElement.style.display = 'none';
            analyzeBtn.disabled = false;
        });
}

async function analyzeSentiment(text) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
    }
    
    const response = await fetch(
        'https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english',
        {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({ inputs: text }),
        }
    );
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
}

function displaySentiment(result) {
    let sentiment = 'neutral';
    let score = 0.5;
    let label = 'NEUTRAL';
    
    if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) && result[0].length > 0) {
        const sentimentData = result[0][0];
        label = sentimentData.label?.toUpperCase() || 'NEUTRAL';
        score = sentimentData.score ?? 0.5;
        
        if (label === 'POSITIVE' && score > 0.5) {
            sentiment = 'positive';
        } else if (label === 'NEGATIVE' && score > 0.5) {
            sentiment = 'negative';
        }
    }
    
    sentimentResult.classList.add(sentiment);
    sentimentResult.innerHTML = `
        <i class="fas ${getSentimentIcon(sentiment)} icon"></i>
        <span>${label} (${(score * 100).toFixed(1)}% confidence)</span>
    `;
    
    return { sentiment, label, score };
}

function getSentimentIcon(sentiment) {
    switch(sentiment) {
        case 'positive':
            return 'fa-thumbs-up';
        case 'negative':
            return 'fa-thumbs-down';
        default:
            return 'fa-question-circle';
    }
}

async function logToGoogleSheets(review, sentiment, confidence, actionTaken) {
    const data = {
        timestamp: new Date().toISOString(),
        review: review.substring(0, 500),
        sentiment: sentiment,
        confidence: confidence.toFixed(4),
        action_taken: actionTaken
    };
    
    try {
        const response = await fetch(sheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        logStatus.className = 'log-status success';
        logStatus.textContent = '✓ Logged to Google Sheets successfully';
    } catch (error) {
        console.error('Sheets logging error:', error);
        logStatus.className = 'log-status error';
        logStatus.textContent = '✗ Failed to log to Google Sheets: ' + error.message;
    }
}

function showError(message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    errorElement.style.display = 'none';
}
