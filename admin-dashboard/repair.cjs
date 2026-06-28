const fs = require('fs');

let content = fs.readFileSync('c:/Users/T490/OneDrive/Documents/cm/frontend/src/CitadelCMS.jsx', 'utf-8');

const corrupted = `      });
      d!", "success");
      } else {`;

const restored = `      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SYNC_DATA", key: "salaries", data: [data, ...salaries] });
        setSalaryStaff("");
        setSalaryRole("");
        setSalaryMonth("");
        setSalaryAmount("");
        toast("Salary payout logged successfully & Leaders notified!", "success");
        // Re-fetch ledger to sync auto-created expense
        const ledgerRes = await fetch(API_URLS.FINANCIAL);
        if (ledgerRes.ok) {
          const ledgerData = await ledgerRes.json();
          dispatch({ type: "SYNC_DATA", key: "financial", data: ledgerData });
        }
      } else {
        const err = await res.json();
        toast(err.error || "Failed to log salary", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setLoggingSalary(false);
    }
  };

  const handleDeleteSalary = async (id) => {
    if (!confirm("Are you sure you want to delete this salary log?")) return;
    try {
      const res = await fetch(\`\${API_URLS.FINANCIAL_SALARIES}/\${id}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${state.session.token}\` }
      });
      if (res.ok) {
        dispatch({ type: "SYNC_DATA", key: "salaries", data: salaries.filter(s => s._id !== id && s.id !== id) });
        toast("Salary log deleted", "success");
      } else {
        toast("Failed to delete salary log", "error");
      }
    } catch (err) {
      toast("Delete failed", "error");
    }
  };

  const handleCreateFundRequest = async (e) => {
    e.preventDefault();
    if (!reqTitle || !reqAmount || !reqDesc || !reqDept) {
      return toast("All request fields are required", "error");
    }
    if (isNaN(reqAmount) || parseFloat(reqAmount) <= 0) {
      return toast("Amount must be a positive number", "error");
    }

    setSubmittingReq(true);
    try {
      const res = await fetch(API_URLS.FINANCIAL_FUND_REQUESTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${state.session.token}\`
        },
        body: JSON.stringify({
          title: reqTitle,
          amount: parseFloat(reqAmount),
          description: reqDesc,
          department: reqDept
        })
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SYNC_DATA", key: "fundRequests", data: [data, ...fundRequests] });
        setReqTitle("");
        setReqAmount("");
        setReqDesc("");
        toast("Fund request submitted successfully & Leaders notified!", "success");
      } else {`;

content = content.replace(corrupted, restored);

fs.writeFileSync('c:/Users/T490/OneDrive/Documents/cm/frontend/src/CitadelCMS.jsx', content, 'utf-8');
console.log("File repaired successfully!");
