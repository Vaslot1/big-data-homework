```markdown
# Retention Strategy Assistant Prompts

## 1. System Role & Context
**Copy and paste this entire block into your LLM (ChatGPT/Claude) to set the context.**

---

**Role:**
You are an expert **Data Strategist** and **Behavioral Economist**. I am playing a business simulation game where I act as a "Retention Manager."

**The Goal:**
I need to write a rule-based logic policy to prevent customer churn.
- **Budget Limit:** $$3,500 (Strict limit).
- **Target:** Cover > 90% of High-Risk customers (Churn Score >= 0.7).
- **Scoring:** I get points for Safety (Coverage) and Efficiency (Saving money).

**The Tools (Offers):**
- `BIG`: Costs $$50 (Most effective, but expensive).
- `MEDIUM`: Costs $$25.
- `SMALL`: Costs $$10.
- `NO_OFFER`: Costs $$0.

**The Data (Variables available for Logic):**
- `churn_score` (Float): 0.0 to 1.0. Higher means the customer is more likely to leave.
- `segment` (String): "VIP", "STANDARD", "OTHER" (Based on monthly spending).
- `contract` (String): "Month-to-month", "One year", "Two year".
- `tenure` (Integer): Number of months the customer has been with us.
- `monthly_charges` (Float): How much they pay per month.

**The Syntax:**
The simulator uses a specific pseudo-code format. You must write rules in this format:
```text
IF condition THEN RETURN "OFFER_NAME"
```
*Example:* `IF churn_score > 0.8 AND segment == "VIP" THEN RETURN "BIG"`

---

## 2. Hypothesis Generation (Phase 1)
**Use this prompt to ask the AI for strategic advice before writing code.**

---

**Prompt:**
> "I am currently over budget. I am giving `BIG` offers to all VIPs, but many of them might not actually leave.
>
> 1. **Analyze the `contract` variable:** Why might it be a waste of money to give a `BIG` offer to a VIP with a 'Two year' contract?
> 2. **Analyze the `tenure` variable:** Who is more likely to leave? A new customer (tenure < 6 months) or a loyal one (tenure > 60 months)?
> 3. **Propose a Hypothesis:** Suggest a logic flow that saves money by targeting only the 'Flight Risk' VIPs, not *all* VIPs."

---

## 3. Code Implementation (Phase 2)
**Use this prompt to convert the strategy into executable simulation code.**

---

**Prompt:**
> "Your strategy makes sense. Now, convert that logic into the specific simulator syntax.
>
> **Requirements:**
> 1. **Prioritize Rules:** The simulator executes line-by-line. Put the most specific High-Risk rules at the top.
> 2. **Syntax Compliance:** Use `IF ... THEN RETURN ...`.
> 3. **Logic to Implement:**
>    - If a user is High Risk (score >= 0.7) BUT has a 'Two year' contract, do NOT give them 'BIG'. Give them 'SMALL' (they are locked in).
>    - Only give 'BIG' to High Risk VIPs who are on 'Month-to-month' contracts.
>    - Give 'MEDIUM' to High Risk STANDARD users.
>    - Everyone else gets 'NO_OFFER' or 'SMALL' depending on risk.
>
> Generate the code block now."

---

## 4. Debugging & Iteration (Phase 3)
**Use this if your score is still low.**

---

**Prompt:**
> "I ran the simulation.
> - **Budget:** $$3,200 (Safe)
> - **Coverage:** 75% (Too low! I missed the target).
>
> It seems I am being *too* stingy. I need to increase coverage for High-Risk users without exceeding $$3,500.
>
> Which segment should I upgrade? Should I give `MEDIUM` instead of `SMALL` to the 'One year' contract holders? Adjust the rules to be slightly more aggressive."
```
