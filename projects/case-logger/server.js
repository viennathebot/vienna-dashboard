const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3847;
const DATA_FILE = path.join(__dirname, 'procedures.json');

app.use(express.json());
app.use(express.static('public'));

// Load procedures
function loadProcedures() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Save procedures
function saveProcedures(procedures) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(procedures, null, 2));
}

// Get all procedures
app.get('/api/procedures', (req, res) => {
  res.json(loadProcedures());
});

// Add a procedure
app.post('/api/procedures', (req, res) => {
  const procedures = loadProcedures();
  const newProcedure = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  procedures.push(newProcedure);
  saveProcedures(procedures);
  res.json(newProcedure);
});

// Delete a procedure
app.delete('/api/procedures/:id', (req, res) => {
  let procedures = loadProcedures();
  procedures = procedures.filter(p => p.id !== parseInt(req.params.id));
  saveProcedures(procedures);
  res.json({ success: true });
});

// Get stats for CV
app.get('/api/stats', (req, res) => {
  const procedures = loadProcedures();
  const stats = {
    total: procedures.length,
    byType: {},
    byYear: {},
    complications: { yes: 0, no: 0 },
    outcomes: {}
  };

  procedures.forEach(p => {
    // By type
    stats.byType[p.procedureType] = (stats.byType[p.procedureType] || 0) + 1;
    
    // By year
    const year = new Date(p.date).getFullYear();
    if (!stats.byYear[year]) stats.byYear[year] = {};
    stats.byYear[year][p.procedureType] = (stats.byYear[year][p.procedureType] || 0) + 1;
    
    // Complications
    if (p.hasComplications) stats.complications.yes++;
    else stats.complications.no++;
    
    // Outcomes
    if (p.outcome) {
      stats.outcomes[p.outcome] = (stats.outcomes[p.outcome] || 0) + 1;
    }
  });

  res.json(stats);
});

// Export for CV (formatted text)
app.get('/api/export/cv', (req, res) => {
  const procedures = loadProcedures();
  const stats = {};
  
  procedures.forEach(p => {
    stats[p.procedureType] = (stats[p.procedureType] || 0) + 1;
  });

  let cvText = "PROCEDURAL EXPERIENCE\n";
  cvText += "=====================\n\n";
  cvText += `Total Procedures: ${procedures.length}\n\n`;
  
  const typeOrder = ['TAVR', 'MitraClip', 'Watchman', 'PFO/ASD closure', 'PCI', 'CTO', 'Renal Denervation', 'LHC', 'RHC', 'TEE', 'TTE', 'Other'];
  
  typeOrder.forEach(type => {
    if (stats[type]) {
      cvText += `${type}: ${stats[type]}\n`;
    }
  });

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename=procedural-experience.txt');
  res.send(cvText);
});

app.listen(PORT, () => {
  console.log(`Case Logger running at http://localhost:${PORT}`);
});
