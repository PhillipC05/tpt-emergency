export function PrintSystem({ incident }) {

  const printIncidentReport = () => {
    const printWindow = window.open('', '_blank')
    
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Incident Report #${incident.incident_number}</title>
<style>
body { font-family: Arial, sans-serif; margin: 20mm; }
.header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
.title { font-size: 24px; font-weight: bold; }
.meta { display: grid; grid-template-columns: 150px 1fr; gap: 8px; margin: 20px 0; }
.label { font-weight: bold; }
.timeline { margin-top: 30px; }
.event { padding: 8px 0; border-bottom: 1px solid #ccc; }
.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
@media print { @page { margin: 15mm; } }
</style>
</head>
<body>
<div class="header">
  <div class="title">INCIDENT REPORT</div>
  <div>Incident Number: ${incident.incident_number}</div>
  <div>Date: ${new Date(incident.created_at).toLocaleString()}</div>
</div>

<div class="meta">
  <div class="label">Type:</div><div>${incident.type}</div>
  <div class="label">Status:</div><div>${incident.status}</div>
  <div class="label">Location:</div><div>${incident.location?.address || 'Not recorded'}</div>
  <div class="label">Units Assigned:</div><div>${incident.units?.length || 0}</div>
</div>

<div class="timeline">
  <h3>TIMELINE</h3>
  ${incident.timeline?.map(event => `
    <div class="event">
      <div>${new Date(event.timestamp).toLocaleString()} - ${event.description}</div>
    </div>
  `).join('') || '<div>No timeline events</div>'}
</div>

<div class="footer">
  <div>Generated: ${new Date().toLocaleString()}</div>
  <div>TPT Emergency System</div>
</div>

</body>
</html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const printCallSheet = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Call Sheet #${incident.incident_number}</title>
<style>
body { font-family: Arial, sans-serif; font-size: 18px; margin: 10mm; }
.callsheet { border: 3px solid #000; padding: 15px; }
.header { text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 15px; }
.big { font-size: 36px; font-weight: bold; text-align: center; padding: 10px; background: #eee; margin: 10px 0; }
.grid { display: grid; grid-template-columns: 120px 1fr; gap: 10px; }
.label { font-weight: bold; }
.units { margin-top: 20px; }
.unit { padding: 8px; border: 1px solid #ccc; margin: 5px 0; }
@media print { @page { margin: 10mm; size: A5 landscape; } }
</style>
</head>
<body>
<div class="callsheet">
  <div class="header">CALL SHEET</div>
  <div class="big">#${incident.incident_number}</div>
  
  <div class="grid">
    <div class="label">TYPE:</div><div>${incident.type.toUpperCase()}</div>
    <div class="label">TIME:</div><div>${new Date(incident.created_at).toLocaleTimeString()}</div>
    <div class="label">ADDRESS:</div><div>${incident.location?.address || '-'}</div>
    <div class="label">INFO:</div><div>${incident.description || '-'}</div>
  </div>

  <div class="units">
    <div class="label">ASSIGNED UNITS:</div>
    ${incident.units?.map(u => `<div class="unit">${u.callsign}</div>`).join('') || '<div class="unit">NO UNITS ASSIGNED</div>'}
  </div>

</div>
</body>
</html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div class="flex gap-2 mt-4">
      <button onClick={printIncidentReport} class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
        🖨️ Print Full Report
      </button>
      <button onClick={printCallSheet} class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
        🖨️ Print Call Sheet
      </button>
    </div>
  )
}