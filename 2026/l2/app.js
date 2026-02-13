/**
 * Retention Policy Designer (Business Logic Simulator)
 * 
 * 🎯 STUDENT TASK:
 * 1. Modify the `DEFAULT_INSTRUCTION` (specifically [RULES] and [POLICY]).
 * 2. Try to achieve: Budget < $3,500 AND High-Risk Coverage > 90%.
 * 3. Use `IF ... THEN ...` logic to target coupons more precisely.
 *    Example: IF segment == "VIP" AND contract == "Two year" THEN RETURN "SMALL"
 * 4. Watch your "Policy Score" increase as you optimize!
 */

const DEFAULT_INSTRUCTION = `ROLE:
Retention Manager AI

CONTEXT:
Customer Data: segment, churn_score, monthly_charges, tenure, contract

INSTRUCTION:
Define your logic using IF/ELSE rules. The system executes them in order.

[RULES]
// 1. Data Quality Gate
IF churn_score == null THEN RETURN "NO_OFFER"

// 2. Low Risk (Ignore)
IF churn_score < 0.4 THEN RETURN "NO_OFFER"

// 3. Medium Risk (Nudge VIPs)
IF churn_score < 0.7 AND segment == "VIP" THEN RETURN "SMALL"
IF churn_score < 0.7 THEN RETURN "NO_OFFER"

// 4. High Risk (Aggressive)
// TASK: Modify logic below to save budget!
IF segment == "VIP" THEN RETURN "BIG"
IF segment == "STANDARD" THEN RETURN "MEDIUM"
RETURN "SMALL"

[MERMAID]
flowchart TD
  Start --> Check{Data Valid?}
  Check -- No --> Z([NO_OFFER])
  Check -- Yes --> Low{Risk < 0.4?}
  Low -- Yes --> Z
  Low -- No --> Med{Risk < 0.7?}
  Med -- Yes --> VIP{Is VIP?}
  VIP -- Yes --> S([SMALL])
  VIP -- No --> Z
  Med -- No --> High{Segment?}
  High -- VIP --> B([BIG])
  High -- STANDARD --> M([MEDIUM])
  High -- OTHER --> S
`;

const el = (id) => document.getElementById(id);

/**
 * Rule Parser Engine
 * Parses the [RULES] block into executable function objects.
 */
function parseRules(instructionText) {
    const lines = instructionText.split("\n");
    const start = lines.findIndex(x => x.trim() === "[RULES]");
    if (start === -1) return [];

    const rules = [];
    for (let i = start + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith("//")) continue; // Skip comments
        if (line.startsWith("[")) break; // End of section
        
        const ifMatch = line.match(/^IF\s+(.+?)\s+THEN\s+RETURN\s+"?([A-Z_]+)"?$/i);
        const returnMatch = line.match(/^RETURN\s+"?([A-Z_]+)"?$/i);

        if (ifMatch) {
            rules.push({ type: "conditional", condition: ifMatch[1], result: ifMatch[2].toUpperCase() });
        } else if (returnMatch) {
            rules.push({ type: "fallback", result: returnMatch[1].toUpperCase() });
        }
    }
    return rules;
}

/**
 * Dynamic Rule Executor
 */
function executeRules(row, rules) {
    for (const rule of rules) {
        if (rule.type === "fallback") {
            return rule.result;
        }

        if (rule.type === "conditional") {
            // Evaluate Condition safely
            // Replace variable names with row values
            let cond = rule.condition
                .replace(/churn_score/g, row.churn_score)
                .replace(/monthly_charges/g, row.monthly_charges)
                .replace(/tenure/g, row.tenure)
                .replace(/segment/g, `"${row.segment}"`) 
                .replace(/contract/g, `"${row.contract}"`); 

            try {
                if (eval(cond)) {
                    return rule.result;
                }
            } catch (e) {
                console.warn("Rule eval error:", cond, e);
            }
        }
    }
    return "NO_OFFER";
}

function extractMermaid(instructionText) {
    const lines = instructionText.split("\n");
    const start = lines.findIndex((x) => x.trim() === "[MERMAID]");
    if (start === -1) return "flowchart TD\n  A[No MERMAID section found]";
    const out = [];
    for (let i = start + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("[") && line.trim() !== "[MERMAID]") break;
        out.push(line);
    }
    return out.join("\n").trim();
}

/**
 * 1. Churn Probability Mockup
 */
function calculateMockChurnScore(row) {
    let score = 0.3; // base probability

    if (row.contract === "Month-to-month") score += 0.4;
    // Note: CSV parser lowers keys, but values might retain case
    // We assume parseCSV keeps values as-is (e.g. "Fiber optic")
    if (String(row.internet_service || "").includes("Fiber")) score += 0.1;
    if (String(row.payment_method || "").includes("Electronic")) score += 0.1;

    const tenure = Number(row.tenure);
    if (tenure > 12) score -= 0.1;
    if (tenure > 48) score -= 0.2;
    if (row.contract === "Two year") score -= 0.3;

    score += (Math.random() - 0.5) * 0.1;

    return Math.max(0.01, Math.min(0.99, score));
}

/**
 * 2. Segment Generation Logic
 */
function determineSegment(row) {
    const charges = Number(row.monthly_charges);
    if (charges >= 90) return "VIP";      
    if (charges >= 50) return "STANDARD"; 
    return "OTHER";                       
}

function offerCost(offer) {
    const o = String(offer).toUpperCase();
    if (o === "BIG") return 50;
    if (o === "MEDIUM") return 25;
    if (o === "SMALL") return 10;
    return 0;
}

/**
 * 3. CSV Parser (Improved for Case-Insensitivity)
 */
function parseCSV(text) {
    const lines = text.trim().split("\n");
    // Force lowercase headers to avoid case sensitivity issues
    const headers = lines[0].split(",").map(h => {
        const clean = h.trim().toLowerCase();
        if (clean === "monthlycharges") return "monthly_charges";
        if (clean === "customerid") return "customer_id";
        if (clean === "internetservice") return "internet_service";
        if (clean === "paymentmethod") return "payment_method";
        return clean;
    });
    
    // Sample only first 300 rows for performance
    const sampleSize = 300; 
    const rows = [];

    for (let i = 1; i < Math.min(lines.length, sampleSize); i++) {
        const cols = lines[i].split(","); 
        if (cols.length < headers.length) continue;

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = cols[idx] ? cols[idx].trim() : "";
        });
        rows.push(row);
    }
    return rows;
}

async function loadData() {
    // In a real deployment, ensure this path is correct
    const res = await fetch("./data/telco_sample.csv");
    if (!res.ok) throw new Error("Failed to load CSV");
    const text = await res.text();
    return parseCSV(text);
}

async function renderMermaid(mermaidCode) {
    // Using global window.__mermaid__ injected in index.html
    const mermaid = window.__mermaid__;
    if (!mermaid) return;
    const container = el("diagram");
    container.innerHTML = `<pre class="mermaid">${escapeHtml(mermaidCode)}</pre>`;
    await mermaid.run({ querySelector: ".mermaid" });
}

function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderTable(rows) {
    const table = el("outTable");
    const headers = ["customer_id", "segment", "monthly_charges", "tenure", "contract", "churn_score", "offer", "cost"];

    table.innerHTML = "";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    headers.forEach((h) => {
        const th = document.createElement("th");
        th.textContent = h;
        trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.slice(0, 15).forEach((r) => {
        const tr = document.createElement("tr");
        headers.forEach((h) => {
            const td = document.createElement("td");
            td.textContent = r[h];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

function fmtMoney(x) {
    return `$${Number(x).toLocaleString()}`;
}

async function main() {
    el("instruction").value = DEFAULT_INSTRUCTION;

    el("runBtn").addEventListener("click", async () => {
        el("status").textContent = "Parsing logic & Simulating...";
        
        try {
            // 1. Parse Dynamic Rules
            const rules = parseRules(el("instruction").value); 
            
            // 2. Load Data
            const raw = await loadData();
            
            // 3. Process Rows
            const enriched = raw.map(r => {
                // Map raw keys to helper function keys
                const churnScore = calculateMockChurnScore({
                    contract: r.contract, 
                    internet_service: r.internet_service || "", 
                    payment_method: r.payment_method || "",
                    tenure: r.tenure,
                    monthly_charges: r.monthly_charges,
                    segment: r.segment 
                });
                
                const segment = determineSegment({
                    monthly_charges: r.monthly_charges
                });
                
                // Execute Dynamic Rules with normalized keys
                const offer = executeRules({ 
                    ...r, 
                    churn_score: churnScore, 
                    segment: segment,
                    monthly_charges: Number(r.monthly_charges),
                    tenure: Number(r.tenure),
                    contract: r.contract
                }, rules);
                
                const cost = offerCost(offer);

                return {
                    customer_id: r.customer_id,
                    segment: segment, 
                    contract: r.contract,
                    monthly_charges: r.monthly_charges,
                    tenure: r.tenure,
                    churn_score: churnScore.toFixed(2), 
                    offer: offer,
                    cost: cost
                };
            });

            // 4. Update KPIs & Score
            const totalCost = enriched.reduce((a, r) => a + Number(r.cost), 0);
            
            // Define "High Risk" as score >= 0.7 for KPI tracking
            const highRisk = enriched.filter((r) => Number(r.churn_score) >= 0.7);
            const highRiskCovered = highRisk.filter((r) => r.offer !== "NO_OFFER").length;
            const coverage = highRisk.length ? (highRiskCovered / highRisk.length) : 0;

            // --- Policy Score Logic (Updated for better balance) ---
            const BUDGET_LIMIT = 3500;
            // Safety Score (Max 50): Target 90% coverage
            const safetyScore = Math.min(50, (coverage / 0.9) * 50);
            
            // Efficiency Score (Max 50): Target $0 spend BUT give base points for staying under limit
            // New Formula: If under budget, Base(30) + Bonus(up to 20 for saving)
            let efficiencyScore = 0;
            if (totalCost <= BUDGET_LIMIT) {
                efficiencyScore = 30 + (20 * (1 - (totalCost / BUDGET_LIMIT)));
            } else {
                efficiencyScore = 0; // Over budget gets 0 efficiency points
            }

            // Penalty: Deduction for every $10 over budget
            let penalty = 0;
            if (totalCost > BUDGET_LIMIT) {
                penalty = (totalCost - BUDGET_LIMIT) * 0.1;
            }
            
            const finalScore = Math.max(0, Math.round(safetyScore + efficiencyScore - penalty));

            // Render KPIs
            el("kpiRows").textContent = String(enriched.length);
            el("kpiBudget").textContent = fmtMoney(totalCost);
            el("kpiCoverage").textContent = `${Math.round(coverage * 100)}%`;
            
            if(el("kpiScore")) {
                el("kpiScore").textContent = finalScore;
                const scoreEl = el("kpiScore");
                if (finalScore >= 85) scoreEl.style.color = "#10b981"; // Green
                else if (finalScore >= 50) scoreEl.style.color = "#f59e0b"; // Orange
                else scoreEl.style.color = "#ef4444"; // Red
            }
            
            el("kpiAvgCost").textContent = fmtMoney(enriched.length ? totalCost / enriched.length : 0);

            // Offer Counts
            const counts = {};
            enriched.forEach((r) => (counts[r.offer] = (counts[r.offer] || 0) + 1));
            el("offerCounts").textContent = JSON.stringify(counts, null, 2);

            // 5. Render Table & Diagram
            renderTable(enriched);
            
            const mermaidCode = extractMermaid(el("instruction").value);
            await renderMermaid(mermaidCode);

            el("status").textContent = "Simulation Complete.";

        } catch (err) {
            console.error(err);
            el("status").textContent = "Error: " + err.message;
        }
    });
}

main();
