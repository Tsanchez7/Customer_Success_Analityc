$path = "c:\Users\CursosTardes\Desktop\APP Gestion y análisis comportamiento cliente"
$outfile = "$path\datos_gestion_clientes.xlsx"

# Eliminar si existe
if (Test-Path $outfile) {
    Remove-Item $outfile
}

# Crear Excel
Write-Host "Creando archivo Excel..."
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false

# Crear workbook
$wb = $excel.Workbooks.Add()

# ===== SHEET 1: Accounts =====
$sheet1 = $wb.Sheets(1)
$sheet1.Name = "Accounts"

# Headers y datos
$accounts = @(
    @("Account_ID", "Account_Name", "MRR_Current", "ARR_Current", "Renewal_Date", "Total_Licenses", "Active_Users", "Product_Usage_Percentage", "Open_Tickets", "Avg_Resolution_Time", "Last_Contact_Date"),
    @("ACC001", "Empresa Tech SA", 5000, 60000, "2026-04-20", 100, 85, 78.5, 2, 2.5, "2026-02-15"),
    @("ACC002", "Digital Solutions Inc", 8500, 102000, "2026-06-20", 200, 140, 92, 1, 1.8, "2026-02-18"),
    @("ACC003", "Cloud Services Ltd", 3200, 38400, "2026-03-22", 75, 45, 55.3, 5, 4.2, "2026-02-05"),
    @("ACC004", "Innovation Labs", 6800, 81600, "2026-05-20", 150, 120, 88.7, 3, 3.1, "2026-02-12"),
    @("ACC005", "Global Ventures", 4500, 54000, "2026-07-20", 120, 60, 45.2, 8, 5.5, "2025-12-06")
)

for ($r = 0; $r -lt $accounts.Count; $r++) {
    for ($c = 0; $c -lt $accounts[$r].Count; $c++) {
        $sheet1.Cells($r + 1, $c + 1) = $accounts[$r][$c]
        if ($r -eq 0) {
            $sheet1.Cells($r + 1, $c + 1).Font.Bold = $true
        }
    }
}

# ===== SHEET 2: Period_Data =====
$sheet2 = $wb.Sheets.Add()
$sheet2.Name = "Period_Data"

$periods = @(
    @("Account_ID", "Period", "MRR_Starting", "Expansion_Revenue", "Contraction_Revenue", "Churned_Revenue", "Clients_Start_Period", "Clients_Churned", "Clients_Eligible_for_Renewal", "Clients_Renewed"),
    @("ACC001", "2025-Q4", 4800, 500, 100, 0, 80, 0, 16, 15),
    @("ACC001", "2026-Q1", 5200, 300, 50, 0, 85, 0, 12, 11),
    @("ACC002", "2025-Q4", 8000, 800, 100, 0, 150, 2, 25, 24),
    @("ACC002", "2026-Q1", 8600, 600, 200, 0, 160, 1, 20, 19),
    @("ACC003", "2025-Q4", 3000, 100, 50, 100, 60, 5, 10, 7),
    @("ACC003", "2026-Q1", 3100, 50, 100, 200, 55, 8, 10, 5),
    @("ACC004", "2025-Q4", 6500, 400, 50, 0, 120, 0, 20, 19),
    @("ACC004", "2026-Q1", 6800, 500, 100, 0, 130, 1, 18, 17),
    @("ACC005", "2025-Q4", 4200, 200, 150, 250, 100, 15, 15, 8),
    @("ACC005", "2026-Q1", 4400, 100, 200, 300, 95, 18, 15, 5)
)

for ($r = 0; $r -lt $periods.Count; $r++) {
    for ($c = 0; $c -lt $periods[$r].Count; $c++) {
        $sheet2.Cells($r + 1, $c + 1) = $periods[$r][$c]
        if ($r -eq 0) {
            $sheet2.Cells($r + 1, $c + 1).Font.Bold = $true
        }
    }
}

# ===== SHEET 3: NPS_Data =====
$sheet3 = $wb.Sheets.Add()
$sheet3.Name = "NPS_Data"

$nps = @(
    @("Account_ID", "Period", "NPS_Response"),
    @("ACC001", "2025-Q4", 9),
    @("ACC001", "2026-Q1", 8),
    @("ACC002", "2025-Q4", 10),
    @("ACC002", "2026-Q1", 9),
    @("ACC002", "2026-Q1", 9),
    @("ACC003", "2025-Q4", 5),
    @("ACC003", "2026-Q1", 6),
    @("ACC004", "2025-Q4", 8),
    @("ACC004", "2026-Q1", 8),
    @("ACC004", "2026-Q1", 9),
    @("ACC005", "2025-Q4", 4),
    @("ACC005", "2026-Q1", 3),
    @("ACC005", "2026-Q1", 5)
)

for ($r = 0; $r -lt $nps.Count; $r++) {
    for ($c = 0; $c -lt $nps[$r].Count; $c++) {
        $sheet3.Cells($r + 1, $c + 1) = $nps[$r][$c]
        if ($r -eq 0) {
            $sheet3.Cells($r + 1, $c + 1).Font.Bold = $true
        }
    }
}

# Ajustar ancho de columnas
@($sheet1, $sheet2, $sheet3) | ForEach-Object {
    $_.UsedRange.Columns.AutoFit() | Out-Null
}

# Guardar
$wb.SaveAs($outfile)
$excel.Quit()

Write-Host "[OK] Excel creado exitosamente: $outfile"
Write-Host "[OK] 3 hojas: Accounts, Period_Data, NPS_Data"
Write-Host "[OK] Archivo listo para cargar en el dashboard"
