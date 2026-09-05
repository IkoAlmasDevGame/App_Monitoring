// ==========================================
// BACKEND: DB_PROGRESS_MAULID (Code.gs)
// ==========================================

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId()

function doPost(e) {
  // CORS Handling is native in GAS Web Apps when called via POST,
  // returning JSON ensures frontend can parse it.

  try {
    let requestData = JSON.parse(e.postData.contents)
    let action = requestData.action
    let payload = requestData.payload

    let result = {}

    switch (action) {
      case 'login':
        result = handleLogin(payload.email, payload.password)
        break
      case 'getData':
        result = handleGetData(payload.sheetName, payload.role)
        break
      case 'getDashboardData':
        result = getDashboardData()
        break
      case 'insertRow':
        result = insertRow(payload.sheetName, payload.data)
        break
      case 'updateRow':
        result = updateRow(payload.sheetName, payload.id, payload.data)
        break
      case 'deleteRow':
        result = deleteRow(payload.sheetName, payload.id)
        break
      default:
        result = { success: false, message: 'Action tidak dikenali' }
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON,
    )
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

// Untuk memastikan web app berjalan
function doGet(e) {
  return ContentService.createTextOutput(
    'Backend DB_PROGRESS_MAULID Active. Gunakan POST untuk API.',
  ).setMimeType(ContentService.MimeType.TEXT)
}

// --- CORE FUNCTIONS ---

function getSheetData(sheetName) {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName)
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan.')

  const data = sheet.getDataRange().getValues()
  if (data.length <= 1) return [] // Kosong (hanya header)

  const headers = data[0]
  const rows = data.slice(1)

  return rows.map((row) => {
    let obj = {}
    headers.forEach((header, index) => {
      obj[header] = row[index]
    })
    return obj
  })
}

function handleLogin(email, password) {
  const users = getSheetData('Users')
  const user = users.find((u) => u.Email === email && u.Password === password)

  if (user) {
    // Jangan kirim password kembali ke frontend
    delete user.Password
    return { success: true, user: user, message: 'Login berhasil' }
  } else {
    return { success: false, message: 'Email atau Password salah' }
  }
}

function handleGetData(sheetName, role = null) {
  let data = getSheetData(sheetName)

  // Fitur Filter by Role
  if (role && role !== 'Sekretaris') {
    // Sekretaris bisa lihat semua. Role lain hanya lihat datanya.
    if (data.length > 0 && data[0].hasOwnProperty('Role')) {
      data = data.filter((item) => item.Role === role)
    }
  }

  return { success: true, data: data }
}

function getDashboardData() {
  const settings = getSheetData('Settings')[0] || {}
  const tugas = getSheetData('Tugas')

  // Hitung progress
  const totalTugas = tugas.length
  const selesai = tugas.filter((t) => t.Status === 'Selesai').length
  const progress =
    totalTugas === 0 ? 0 : Math.round((selesai / totalTugas) * 100)

  // Hitung per seksi untuk chart
  let chartData = {}
  tugas.forEach((t) => {
    if (t.Role) {
      if (!chartData[t.Role]) chartData[t.Role] = { total: 0, selesai: 0 }
      chartData[t.Role].total++
      if (t.Status === 'Selesai') chartData[t.Role].selesai++
    }
  })

  return {
    success: true,
    settings: settings,
    stats: {
      progressKeseluruhan: progress,
      totalTugas: totalTugas,
      chartData: chartData,
    },
  }
}

function insertRow(sheetName, rowData) {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName)
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]

  // Generate ID unique
  const newId =
    sheetName.substring(0, 3).toUpperCase() + '-' + new Date().getTime()
  rowData['ID'] = newId

  const newRow = headers.map((header) => rowData[header] || '')
  sheet.appendRow(newRow)

  return { success: true, message: 'Data berhasil ditambahkan', id: newId }
}

function updateRow(sheetName, id, rowData) {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName)
  const data = sheet.getDataRange().getValues()
  const headers = data[0]

  let rowIndex = -1
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      // Asumsi ID selalu di kolom A (index 0)
      rowIndex = i + 1 // +1 karena sheet index mulai dari 1
      break
    }
  }

  if (rowIndex === -1)
    return { success: false, message: 'Data tidak ditemukan' }

  headers.forEach((header, index) => {
    if (rowData.hasOwnProperty(header) && header !== 'ID') {
      sheet.getRange(rowIndex, index + 1).setValue(rowData[header])
    }
  })

  return { success: true, message: 'Data berhasil diupdate' }
}
