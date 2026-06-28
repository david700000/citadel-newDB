const fs = require('fs');

let content = fs.readFileSync('c:/Users/T490/OneDrive/Documents/cm/frontend/src/CitadelCMS.jsx', 'utf-8');

const chart_comp = `const FinancialCharts = ({ logs }) => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();

  if (selectedMonth !== null) {
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
    const dailyIncome = Array(daysInMonth).fill(0);
    const dailyExpense = Array(daysInMonth).fill(0);
    
    logs.forEach(l => {
      const d = new Date(l.date);
      if (d.getFullYear() === currentYear && d.getMonth() === selectedMonth) {
        const dayIdx = d.getDate() - 1;
        if (l.type === "income") dailyIncome[dayIdx] += l.amount;
        else dailyExpense[dayIdx] += l.amount;
      }
    });

    const maxVal = Math.max(...dailyIncome, ...dailyExpense, 100);
    const chartH = 150;
    
    return (
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Btn onClick={() => setSelectedMonth(null)} variant="ghost" small>← Back</Btn>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans',sans-serif" }}>Daily Breakdown — {months[selectedMonth]} {currentYear}</h4>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>● Income</span>
            <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>● Expense</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: chartH + 28, overflowX: "auto", paddingBottom: 8 }}>
          {Array.from({length: daysInMonth}).map((_, idx) => {
            const incH = (dailyIncome[idx] / maxVal) * chartH;
            const expH = (dailyExpense[idx] / maxVal) * chartH;
            return (
              <div key={idx} style={{ flex: 1, minWidth: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: chartH, width: "100%", justifyContent: "center" }}>
                  <div title={\`Income: ₦\${dailyIncome[idx].toLocaleString()}\`} style={{ width: "40%", maxWidth: 12, height: Math.max(incH, 2), background: "#059669", borderRadius: "2px 2px 0 0" }} />
                  <div title={\`Expense: ₦\${dailyExpense[idx].toLocaleString()}\`} style={{ width: "40%", maxWidth: 12, height: Math.max(expH, 2), background: "#dc2626", borderRadius: "2px 2px 0 0" }} />
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{idx + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const monthlyIncome = Array(12).fill(0);
  const monthlyExpense = Array(12).fill(0);
  logs.forEach(l => {
    const d = new Date(l.date);
    if (d.getFullYear() === currentYear) {
      const m = d.getMonth();
      if (l.type === "income") monthlyIncome[m] += l.amount;
      else monthlyExpense[m] += l.amount;
    }
  });
  const maxVal = Math.max(...monthlyIncome, ...monthlyExpense, 100);
  const chartH = 150;
  
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans',sans-serif" }}>Monthly Cash Flow — {currentYear} <span style={{fontSize: 12, color:"#6b7280", fontWeight:500, marginLeft: 8}}>(Click month for daily view)</span></h4>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>● Income</span>
          <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>● Expense</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: chartH + 28, overflowX: "auto" }}>
        {months.map((m, idx) => {
          const incH = (monthlyIncome[idx] / maxVal) * chartH;
          const expH = (monthlyExpense[idx] / maxVal) * chartH;
          return (
            <div key={idx} onClick={() => setSelectedMonth(idx)} style={{ flex: 1, minWidth: 40, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", padding: "4px 0", borderRadius: 8, transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#f8fafc"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: chartH, width: "100%", justifyContent: "center" }}>
                <div title={\`Income: ₦\${monthlyIncome[idx].toLocaleString()}\`} style={{ width: "46%", maxWidth: 20, height: Math.max(incH, 3), background: "#059669", borderRadius: "3px 3px 0 0" }} />
                <div title={\`Expense: ₦\${monthlyExpense[idx].toLocaleString()}\`} style={{ width: "46%", maxWidth: 20, height: Math.max(expH, 3), background: "#dc2626", borderRadius: "3px 3px 0 0" }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{m}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FinancialDashboard`;

content = content.replace('const FinancialDashboard', chart_comp);

// 2. Remove renderFinancialCharts from LeaderDashboard
content = content.replace(/  const renderFinancialCharts = \(\) => \{[\s\S]*?    \);\n  \};\n\n/g, function(match, offset, string) {
    if(offset > 2000 && offset < 2800) return "";
    return match;
});

// 3. Leader grid
content = content.replace(
\`            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard label="Total Income" value={\\\`₦\${totalIncome.toLocaleString()}\\\`} icon="dashboard" accent />
              <StatCard label="Total Expenses" value={\\\`₦\${totalExpense.toLocaleString()}\\\`} icon="forms" />
              <StatCard label="Net Balance" value={\\\`₦\${(totalIncome - totalExpense).toLocaleString()}\\\`} icon="settings" />
            </div>

            {renderFinancialCharts()}\`,
\`            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              <StatCard label="Total Income" value={\\\`₦\${totalIncome.toLocaleString()}\\\`} icon="dashboard" accent />
              <StatCard label="Total Expenses" value={\\\`₦\${totalExpense.toLocaleString()}\\\`} icon="forms" />
              <StatCard label="Net Balance" value={\\\`₦\${(totalIncome - totalExpense).toLocaleString()}\\\`} icon="settings" />
            </div>

            <FinancialCharts logs={logs} />\`);


// 4. Fin grid and charts
content = content.replace(
\`            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Income", val: \\\`₦\${totalIncome.toLocaleString()}\\\`, color: "#059669", border: "#059669", sub: \\\`\${logs.filter(l => l.type === "income").length} entries\\\` },
                { label: "Total Expenses", val: \\\`₦\${totalExpense.toLocaleString()}\\\`, color: "#dc2626", border: "#dc2626", sub: \\\`\${logs.filter(l => l.type === "expense").length} entries\\\` },
                { label: "Net Balance", val: \\\`₦\${balance.toLocaleString()}\\\`, color: balance >= 0 ? "#059669" : "#dc2626", border: "#0B1F3B", sub: "Current surplus/deficit" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #e5e7eb", borderLeft: \\\`4px solid \${c.border}\\\`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c.color, fontFamily: "'DM Sans',sans-serif" }}>{c.val}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {renderFinancialCharts()}\`,
\`            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Income", val: \\\`₦\${totalIncome.toLocaleString()}\\\`, color: "#059669", border: "#059669", sub: \\\`\${logs.filter(l => l.type === "income").length} entries\\\` },
                { label: "Total Expenses", val: \\\`₦\${totalExpense.toLocaleString()}\\\`, color: "#dc2626", border: "#dc2626", sub: \\\`\${logs.filter(l => l.type === "expense").length} entries\\\` },
                { label: "Net Balance", val: \\\`₦\${balance.toLocaleString()}\\\`, color: balance >= 0 ? "#059669" : "#dc2626", border: "#0B1F3B", sub: "Current surplus/deficit" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #e5e7eb", borderLeft: \\\`4px solid \${c.border}\\\`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c.color, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.val}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{c.sub}</div>
                </div>
              ))}
            </div>

            <FinancialCharts logs={logs} />\`);


// 5. Salary Tracker Grid
content = content.replace(
\`            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Staff Paid", val: \\\`₦\${salaries.filter(s => s.status === "paid").reduce((a, s) => a + s.amount, 0).toLocaleString()}\\\`, color: "#059669", border: "#059669" },
                { label: "Total Pending", val: \\\`₦\${salaries.filter(s => s.status === "pending").reduce((a, s) => a + s.amount, 0).toLocaleString()}\\\`, color: "#f59e0b", border: "#f59e0b" },
                { label: "Total Payroll", val: \\\`₦\${salaries.reduce((a, s) => a + s.amount, 0).toLocaleString()}\\\`, color: "#0B1F3B", border: "#0B1F3B" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #e5e7eb", borderLeft: \\\`4px solid \${c.border}\\\`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>\`,
\`            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Staff Paid", val: \\\`₦\${salaries.filter(s => s.status === "paid").reduce((a, s) => a + s.amount, 0).toLocaleString()}\\\`, color: "#059669", border: "#059669" },
                { label: "Total Pending", val: \\\`₦\${salaries.filter(s => s.status === "pending").reduce((a, s) => a + s.amount, 0).toLocaleString()}\\\`, color: "#f59e0b", border: "#f59e0b" },
                { label: "Total Payroll", val: \\\`₦\${salaries.reduce((a, s) => a + s.amount, 0).toLocaleString()}\\\`, color: "#0B1F3B", border: "#0B1F3B" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #e5e7eb", borderLeft: \\\`4px solid \${c.border}\\\`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>\`);


// 6. Fund Request Grid
content = content.replace(
\`            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Pending Requests", val: fundRequests.filter(r => r.status === "pending").length, color: "#f59e0b", border: "#f59e0b" },
                { label: "Approved", val: fundRequests.filter(r => r.status === "approved").length, color: "#059669", border: "#059669" },
                { label: "Total Requested", val: \\\`₦\${fundRequests.reduce((a, r) => a + r.amount, 0).toLocaleString()}\\\`, color: "#0B1F3B", border: "#0B1F3B" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #e5e7eb", borderLeft: \\\`4px solid \${c.border}\\\`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>\`,
\`            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Pending Requests", val: fundRequests.filter(r => r.status === "pending").length, color: "#f59e0b", border: "#f59e0b" },
                { label: "Approved", val: fundRequests.filter(r => r.status === "approved").length, color: "#059669", border: "#059669" },
                { label: "Total Requested", val: \\\`₦\${fundRequests.reduce((a, r) => a + r.amount, 0).toLocaleString()}\\\`, color: "#0B1F3B", border: "#0B1F3B" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #e5e7eb", borderLeft: \\\`4px solid \${c.border}\\\`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>\`);

fs.writeFileSync('c:/Users/T490/OneDrive/Documents/cm/frontend/src/CitadelCMS.jsx', content, 'utf-8');
console.log("Done");
