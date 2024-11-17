export const getSector = async (vacancyTitle) => {
    const title = vacancyTitle.toLowerCase();

    const keywords = {
        "Finance & Banking": [
            "finance", "financial", "bank", "accountant", "cpa", "investment", "auditor", "analyst", "treasury",
            "loan", "credit", "asset management", "wealth management", "quantitative", "fintech", "tax", "budget",
            "reporting", "cash", "capital", "risk", "valuation", "trader", "underwriter", "hedge", "mortgage",
            "cfo", "financial controller", "fund", "portfolio", "private equity", "securities", "payroll", "audit",
            "financial advisor", "compliance", "regulatory", "dividend", "amortization", "debt", "profit", "ledger",
            "financial modeling", "credit analyst", "banking operations", "treasury analyst", "fraud prevention"
        ],
        "Legal": [
            "legal", "advisor", "lawyer", "attorney", "paralegal", "compliance", "litigation", "notary", "solicitor", "contract",
            "jurisprudence", "barrister", "regulatory", "counsel", "law", "consultant", "aml", "gdpr", "due diligence",
            "corporate law", "criminal law", "litigator", "legal analyst", "intellectual property", "mediation", "arbitration",
            "case management", "employment law", "patent", "trademark", "compliance officer", "jurisdiction", "regulation",
            "investigation", "evidence", "ethics", "advocate", "corporate governance", "claims", "dispute resolution"
        ],
        "Sales": [
            "sales", "salesperson", "retail", "crm", "lead generation", "account manager", "business development", "merchandiser",
            "negotiator", "sales manager", "sales executive", "client manager", "merchandising", "customer success", "order",
            "closer", "territory manager", "prospecting", "inside sales", "outside sales", "b2b", "sales consultant",
            "relationship manager", "pipeline", "closing", "quota", "channel sales", "deal", "target", "sales representative",
            "revenue", "salesforce", "customer acquisition", "upselling", "cross-selling", "sales performance", "business growth"
        ],
        "IT": [
            "it", "developer", "software", "programmer", "systems", "agile", "scrum", "cloud", "database", "network",
            "security", "qa", "devops", "data engineer", "data scientist", "ml engineer", "ai", "technology", "full stack",
            "frontend", "backend", "cyber", "cloud architect", "sysadmin", "support", "aws", "azure", "gcp", "linux",
            "sql", "mongo", "postgre", "python", "java", "javascript", "c++", "swift", "jira", "docker", "kubernetes",
            "ci/cd", "nodejs", "project manager", "application", "it support", "security analyst", "data analytics",
            "team", "infrastructure", "blockchain", "big data", "digital transformation", "erp", "saas", "net",
            "junior", "middle", "senior", "lead", "owner", "scripting", "nosql", "frontend developer", "backend developer",
            "react", "angular", "typescript", "cloud engineer", "machine learning", "deep learning", "data visualization"
        ],
        "Engineering": [
            "engineer", "engineering", "mechanical", "electrical", "civil", "structural", "design", "manufacturing",
            "production", "aerospace", "automotive", "hardware", "construction", "environmental", "quality engineer",
            "project engineer", "chemical engineer", "biomedical", "materials", "mechatronics", "robotics", "cad",
            "solidworks", "hvac", "rf engineer", "systems engineer", "infrastructure", "automation", "nanotechnology",
            "test engineer", "validation", "embedded", "factory", "pipeline", "plant", "prototyping", "energy",
            "research and development", "automation engineer", "control systems", "mechanics", "3d modeling", "thermal",
            "vibration analysis", "circuit", "construction management", "manufacturing engineer", "field engineer"
        ],
        "Economics": [
            "economics", "economist", "macro", "micro", "economic", "econometric", "market researcher", "policy analyst",
            "forecaster", "public policy", "econometrician", "quantitative", "economic modeling", "supply chain",
            "fiscal", "monetary policy", "trade", "international", "global", "inflation", "economic analyst", "statistics",
            "economy", "cost-benefit", "consumer behavior", "labor market", "economic theory", "public finance",
            "price analysis", "commodity", "demographics", "labor economics", "competition", "development economics"
        ],
        "Business & Communications": [
            "business", "communications", "pr", "public relations", "marketing", "advertising", "branding", "copywriter",
            "corporate", "brand manager", "media", "communications specialist", "content", "digital marketing", "crm",
            "customer relationship", "salesforce", "hubspot", "google analytics", "seo", "sem", "social media", "market research",
            "email marketing", "client success", "product manager", "operations", "project manager", "business analyst",
            "scrum master", "consultant", "stakeholder", "partnership", "strategy", "market analysis", "campaign", "b2c",
            "b2b", "outreach", "journalism", "reputation", "advertisement", "media planning", "press release", "online marketing",
            "client retention", "brand awareness", "thought leadership", "internal communications", "external communications"
        ]
    };

    let maxMatches = 0;
    let matchedCategory = "Other";

    for (const [category, words] of Object.entries(keywords)) {
        let matches = words.reduce((count, word) => count + (title.includes(word) ? 1 : 0), 0);

        if (matches > maxMatches) {
            maxMatches = matches;
            matchedCategory = category;
        }
    }

    return matchedCategory;
}