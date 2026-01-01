## Course Tools

A collection of helpful calculators and utilities designed to streamline time-consuming tasks across various academic courses. Whether you're working through linear algebra problems, solving calculus equations, balancing chemical reactions, or analyzing algorithms, Course Tools aims to make your academic work more efficient.

### What is Course Tools?

Course Tools is a web application that provides quick, reliable calculators and problem-solving aids for common academic tasks.

- **[x]** Built with Next.js App Router, TypeScript, and Tailwind CSS  
- **[x]** Light, pastel UI theme consistent across tools  
- **[x]** Deployed on Vercel

Some tools use a paid OpenAI API behind the scenes; rate limiting is in place to prevent abuse and control costs.

### Feature Checklist

- **Linear Algebra**
  - **[x]** Basic matrix utilities (determinant, transpose)  
  - **[x]** Matrix multiplication  
  - **[x]** Matrix inverse  
  - **[x]** Eigenvalues and eigenvectors  

- **Calculus**
  - **[x]** Tabbed calculus tools page  
  - **[x]** Derivative calculator
    - **[x]** Uses `mathjs` to parse expressions and compute derivatives  
    - **[x]** Uses OpenAI to generate explanations  
    - **[x]** Evaluates \( f'(x) \) at a point with rounding to avoid FP noise  
  - **[x]** Integral calculator
    - **[x]** Supports definite and indefinite integrals  
    - **[x]** Uses `mathjs` + trapezoidal rule for reliable numeric definite integrals  
    - **[x]** Uses OpenAI to explain the result and show a clean integral expression  
    - **[x]** Rounds numeric output to 5 decimals to hide tiny FP errors  
  - **[ ]** Limit calculator  
  - **[ ]** Series / Taylor expansion tools  
  - **[ ]** Function graphing  

- **Computer Science**
  - **[x]** CS tools hub with tabs  
  - **[x]** Big-O complexity analyzer
    - **[x]** Pattern-matching mode (runs fully in the browser)  
    - **[x]** OpenAI-powered analysis mode via `/api/analyze-complexity`  
  - **[x]** Number base converter (binary / octal / decimal / hex)  
  - **[ ]** Additional CS utilities (regex tester, data-structure helpers, etc.)  

- **Chemistry**
  - **[ ]** Molar mass calculator  
  - **[ ]** Stoichiometry helpers  
  - **[ ]** pH / pOH tools  
  - **[ ]** Equation balancing  

- **Proofs & Logic**
  - **[ ]** Truth table generator  
  - **[ ]** Logical equivalence checker  
  - **[ ]** Proof assistant / checker  

### Access & Rate Limiting

- **[x]** Public site access (no password required)  
- **[x]** IP-based rate limiting on OpenAI API endpoints (30 requests per 15 minutes per IP)  
- **[x]** Rate limiting prevents abuse and controls API costs  
- **[ ]** Per-user accounts and roles  

### Infrastructure & DX

- **[x]** ESLint + TypeScript setup  
- **[x]** Tailwind CSS with custom globals and gradients  
- **[x]** OpenAI integration wired via environment variables (`OPENAI_API_KEY`, optional `OPENAI_MODEL`)  
- **[ ]** Automated tests for core calculators  
- **[ ]** CI checks for linting and type safety  

### Future Plans

- **Short Term**
  - **[ ]** Expand linear algebra tools (multiplication, inverse, eigenvalues, eigenvectors)  
  - **[ ]** Add more calculus tools (limits, series, graphing)  
  - **[ ]** Implement chemistry calculators (molar mass, stoichiometry)  
  - **[ ]** Add more CS utilities (regex tester, data-structure visualizations)  

- **Medium Term**
  - **[ ]** Step-by-step solution explanations across tools  
  - **[ ]** Local history of recent calculations  
  - **[ ]** Export to PDF / LaTeX for worked solutions  

- **Long Term**
  - **[ ]** User accounts with saved preferences and calculation history  
  - **[ ]** Collaborative / shareable calculation links  
  - **[ ]** Mobile app  
  - **[ ]** Integration with note-taking tools  
  - **[ ]** Deeper AI-powered problem-solving hints and adaptive tutoring  

