let CONFIG = { GAS_URL: localStorage.getItem('gas_url') || 'https://script.google.com/macros/s/AKfycbx0KX8VOE5Y5up9T-T9LEckl8ZB4JdDTkW-uRwT_E43PaA96fgupBL0rSWIfwNREWEu/exec' }

const STATE = {
  user: null,
  settings: {},
  dashboardStats: null,
  currentView: 'dashboard',
}
const ROLES = [
  'Sekretaris',
  'Bendahara',
  'Konsumsi',
  'Acara',
  'Perlengkapan',
  'Humas',
  'Keamanan',
]

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons()
  if (!CONFIG.GAS_URL)
    document.getElementById('setupModal').classList.remove('hidden-app')
  else checkSession()
})

function saveSetup() {
  const url =
    'https://script.google.com/macros/s/AKfycbx0KX8VOE5Y5up9T-T9LEckl8ZB4JdDTkW-uRwT_E43PaA96fgupBL0rSWIfwNREWEu/exec'
  if (!url) return showToast('URL tidak boleh kosong', 'error')
  localStorage.setItem('gas_url', url)
  CONFIG.GAS_URL = url
  document.getElementById('setupModal').classList.add('hidden-app')
  showToast('Tersimpan.', 'success')
  checkSession()
}

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka || 0)
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  if (sidebar.classList.contains('-translate-x-full')) {
    sidebar.classList.remove('-translate-x-full')
    overlay.classList.remove('hidden')
    setTimeout(() => overlay.classList.remove('opacity-0'), 10)
  } else {
    sidebar.classList.add('-translate-x-full')
    overlay.classList.add('opacity-0')
    setTimeout(() => overlay.classList.add('hidden'), 300)
  }
}

async function apiCall(action, payload = {}) {
  try {
    const response = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    })
    const result = await response.json()
    if (!result.success) throw new Error(result.message)
    return result
  } catch (error) {
    throw error
  }
}

function showLoader(text = 'Memuat...') {
  document.getElementById('loaderText').innerText = text
  document.getElementById('globalLoader').classList.remove('hidden-app')
}
function hideLoader() {
  document.getElementById('globalLoader').classList.add('hidden-app')
}
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer')
  const toast = document.createElement('div')
  let bg =
    type === 'success'
      ? 'bg-brand-green'
      : type === 'error'
        ? 'bg-red-500'
        : 'bg-slate-800'
  let icon =
    type === 'success'
      ? 'check-circle'
      : type === 'error'
        ? 'alert-circle'
        : 'info'
  toast.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium ${bg} border border-white/10`
  toast.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i> <span class="leading-tight">${message}</span>`
  container.appendChild(toast)
  lucide.createIcons()
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(100%)'
    setTimeout(() => toast.remove(), 300)
  }, 3500)
}

function checkSession() {
  const saved = localStorage.getItem('maulid_user')
  if (saved) {
    STATE.user = JSON.parse(saved)
    loadApp()
  } else {
    document.getElementById('view-login').classList.remove('hidden-app')
    document.getElementById('view-app').classList.add('hidden-app')
  }
}

async function handleLogin(e) {
  e.preventDefault()
  const btn = document.getElementById('btnLogin')
  btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Memproses...`
  btn.disabled = true
  try {
    const res = await apiCall('login', {
      username: document.getElementById('loginUsername').value,
      password: document.getElementById('loginPassword').value,
    })
    showToast(`Ahlan wa Sahlan, ${res.user.Nama}`, 'success')
    STATE.user = res.user
    localStorage.setItem('maulid_user', JSON.stringify(res.user))
    loadApp()
  } catch (err) {
    showToast(err.message, 'error')
    btn.innerHTML = `Masuk <i data-lucide="arrow-right" class="w-4 h-4"></i>`
    btn.disabled = false
    lucide.createIcons()
  }
}
function logout() {
  localStorage.removeItem('maulid_user')
  location.reload()
}

async function loadApp() {
  document.getElementById('view-login').classList.add('hidden-app')
  document.getElementById('view-app').classList.remove('hidden-app')
  document.getElementById('userNameDisplay').innerText = STATE.user.Nama
  document.getElementById('userRoleDisplay').innerText = STATE.user.Role
  document.getElementById('userInitial').innerText =
    STATE.user.Nama.charAt(0).toUpperCase()

  generateNavigation()
  showLoader('Menyiapkan...')
  try {
    const res = await apiCall('getDashboardData')
    STATE.settings = res.settings
    STATE.dashboardStats = res.stats
    startCountdown(STATE.settings.TanggalAcara)
    renderDashboard()
  } catch (err) {
    showToast('Gagal memuat data utama', 'error')
  }
  hideLoader()
}

function startCountdown(dateStr) {
  if (!dateStr) return
  const target = new Date(dateStr).getTime()
  const el = document.getElementById('countdownTimer')
  setInterval(() => {
    const diff = target - new Date().getTime()
    if (diff < 0) {
      el.innerText = 'Hari H Acara!'
      return
    }
    el.innerText = `H - ${Math.floor(diff / (1000 * 60 * 60 * 24))} Maulid`
  }, 1000)
}

function generateNavigation() {
  const role = STATE.user.Role
  let links = [
    { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard Utama' },
    { id: 'tugas', icon: 'check-square', label: 'Tugas Saya' },
  ]

  if (role === 'Sekretaris' || role === 'Ketua') {
    links.push(
      { id: 'agenda', icon: 'calendar', label: 'Agenda Acara' },
      { id: 'all_tugas', icon: 'list-todo', label: 'Semua Tugas' },
      { id: 'keuangan', icon: 'wallet', label: 'Keuangan' },
      { id: 'konsumsi', icon: 'coffee', label: 'Data Konsumsi' },
      { id: 'inventaris', icon: 'box', label: 'Inventaris & Aset' },
      { id: 'tamuvip', icon: 'users', label: 'Daftar Tamu VIP' },
      { id: 'dokumentasi', icon: 'camera', label: 'Dokumentasi' },
    )
  } else if (role === 'Acara') {
    links.push({ id: 'agenda', icon: 'calendar', label: 'Agenda Acara' })
  } else if (role === 'Bendahara') {
    links.push({ id: 'keuangan', icon: 'wallet', label: 'Manajemen Keuangan' })
  } else if (role === 'Konsumsi') {
    links.push({ id: 'konsumsi', icon: 'coffee', label: 'Data Konsumsi' })
  } else if (role === 'Perlengkapan') {
    links.push({ id: 'inventaris', icon: 'box', label: 'Inventaris & Aset' })
  } else if (role === 'Humas' || role === 'Dokumentasi') {
    links.push(
      { id: 'tamuvip', icon: 'users', label: 'Daftar Tamu VIP' },
      { id: 'dokumentasi', icon: 'camera', label: 'Dokumentasi' },
    )
  }

  document.getElementById('mainNav').innerHTML = links
    .map(
      (l) => `
                <a href="#" onclick="navigate('${l.id}', '${l.label}'); return false;" id="nav-${l.id}"
                   class="nav-item group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 font-semibold hover:bg-brand-green/10 hover:text-brand-green transition-all mb-1 text-sm">
                    <i data-lucide="${l.icon}" class="w-5 h-5 transition-transform group-hover:scale-110"></i> ${l.label}
                </a>`,
    )
    .join('')
  lucide.createIcons()
  updateNavUI('dashboard')
}

function updateNavUI(id) {
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.remove('bg-brand-green/10', 'text-brand-green')
    el.classList.add('text-slate-500')
  })
  const active = document.getElementById(`nav-${id}`)
  if (active) {
    active.classList.remove('text-slate-500')
    active.classList.add('bg-brand-green/10', 'text-brand-green')
  }
}

function navigate(id, title) {
  STATE.currentView = id
  document.getElementById('headerTitle').innerText = title
  document.getElementById('mobileHeaderTitle').innerText = title
  updateNavUI(id)
  if (
    window.innerWidth < 768 &&
    !document.getElementById('sidebar').classList.contains('-translate-x-full')
  )
    toggleSidebar()

  if (id === 'dashboard') renderDashboard()
  else if (id === 'tugas') renderTugas(STATE.user.Role)
  else if (id === 'all_tugas') renderTugas()
  else if (id === 'keuangan') renderKeuangan()
  else if (id === 'inventaris') renderInventaris()
  else if (id === 'konsumsi') renderKonsumsi()
  else if (id === 'tamuvip') renderTamuVIP()
  else if (id === 'dokumentasi') renderDokumentasi()
  else if (id === 'agenda') renderAgenda()
  else loadGenericTable(id)
}

function renderDashboard() {
  showLoader('Memuat data monitoring...')

  // Menggunakan Promise (.then) sebagai pengganti async/await
  apiCall('getData', { sheetName: 'Tugas' })
    .then((resTugas) => {
      const tugas = resTugas.data

      let totalSelesai = 0,
        totalOnProgress = 0,
        totalBelum = 0
      const chartData = {}

      tugas.forEach((t) => {
        const r = t.Role || 'Lainnya'
        if (!chartData[r])
          chartData[r] = { Selesai: 0, OnProgress: 0, Belum: 0 }

        if (t.Status === 'Selesai') {
          chartData[r].Selesai++
          totalSelesai++
        } else if (t.Status === 'On Progress') {
          chartData[r].OnProgress++
          totalOnProgress++
        } else {
          chartData[r].Belum++
          totalBelum++
        }
      })

      const totalTugas = tugas.length
      const progressKeseluruhan =
        totalTugas === 0 ? 0 : Math.round((totalSelesai / totalTugas) * 100)

      const html = `
                    <!-- Cards Row -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
                        
                        <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 flex items-center gap-4 md:gap-5 relative overflow-hidden group">
                            <div class="absolute right-[-10%] top-[-10%] w-24 h-24 bg-brand-green/5 rounded-full transition-transform group-hover:scale-150"></div>
                            <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-brand-green to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-green/20 shrink-0">
                                <i data-lucide="check-circle" class="w-6 h-6 md:w-7 md:h-7"></i>
                            </div>
                            <div>
                                <p class="text-slate-500 text-xs md:text-sm font-semibold uppercase tracking-wide">Progress Keseluruhan</p>
                                <h3 class="text-2xl md:text-3xl font-bold text-slate-800">${progressKeseluruhan}%</h3>
                            </div>
                        </div>

                        <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 flex items-center gap-4 md:gap-5 group relative overflow-hidden">
                            <div class="absolute right-[-10%] top-[-10%] w-24 h-24 bg-brand-gold/5 rounded-full transition-transform group-hover:scale-150"></div>
                            <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-brand-gold to-amber-400 flex items-center justify-center text-white shadow-lg shadow-brand-gold/20 shrink-0">
                                <i data-lucide="list-todo" class="w-6 h-6 md:w-7 md:h-7"></i>
                            </div>
                            <div>
                                <p class="text-slate-500 text-xs md:text-sm font-semibold uppercase tracking-wide">Total Tugas Panitia</p>
                                <h3 class="text-2xl md:text-3xl font-bold text-slate-800">${totalTugas}</h3>
                            </div>
                        </div>

                        <div class="bg-gradient-to-br from-slate-800 to-slate-900 p-5 md:p-6 rounded-3xl shadow-card border border-slate-800 text-white relative overflow-hidden sm:col-span-2 md:col-span-1 flex flex-col justify-center">
                            <i data-lucide="mosque" class="absolute right-[-5%] bottom-[-5%] w-24 h-24 text-white/5 rotate-12"></i>
                            <h4 class="font-arabic text-xl md:text-2xl text-brand-goldLight mb-1.5 leading-tight">${STATE.settings.NamaAcara || 'Maulid Nabi'}</h4>
                            <div class="space-y-1">
                                <p class="text-xs md:text-sm text-slate-300 flex items-center gap-2"><i data-lucide="map-pin" class="w-3.5 h-3.5 opacity-70"></i> <span class="truncate">${STATE.settings.Lokasi || '-'}</span></p>
                            </div>
                        </div>
                    </div>

                    <!-- Chart & Info Row -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in" style="animation-delay: 0.1s">
                        
                        <!-- Bar Chart (Per Seksi) -->
                        <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 lg:col-span-2 flex flex-col">
                            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm md:text-base"><i data-lucide="bar-chart-2" class="w-5 h-5 text-brand-green"></i> Monitoring Kinerja per Seksi</h3>
                            <div class="relative flex-1 w-full min-h-[250px] md:min-h-[300px]">
                                <canvas id="progressChart"></canvas>
                            </div>
                        </div>
                        
                        <!-- Doughnut Chart & Notifikasi -->
                        <div class="space-y-4 md:space-y-6 flex flex-col">
                            
                            <!-- Pie Chart (Overall Status) -->
                            <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 flex flex-col items-center">
                                <h3 class="font-bold text-slate-800 mb-3 w-full text-left flex items-center gap-2 text-sm md:text-base"><i data-lucide="pie-chart" class="w-5 h-5 text-brand-gold"></i> Status Keseluruhan</h3>
                                <div class="relative w-full max-w-[160px] aspect-square">
                                    <canvas id="overallPieChart"></canvas>
                                </div>
                                <div class="w-full flex justify-center gap-4 mt-4 text-[10px] font-bold uppercase tracking-wider">
                                    <div class="flex items-center gap-1.5 text-emerald-600"><span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> ${totalSelesai} Selesai</div>
                                    <div class="flex items-center gap-1.5 text-blue-500"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> ${totalOnProgress} Proses</div>
                                    <div class="flex items-center gap-1.5 text-slate-400"><span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span> ${totalBelum} Belum</div>
                                </div>
                            </div>

                            <!-- Notifications -->
                            <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 flex-1">
                                <h3 class="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base mb-4"><i data-lucide="bell-ring" class="w-5 h-5 text-brand-gold"></i> Info Sistem</h3>
                                <div class="space-y-3">
                                    <div class="p-3 md:p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3.5 items-start transition-colors hover:bg-slate-100">
                                        <div class="w-2.5 h-2.5 rounded-full bg-brand-green mt-1.5 flex-shrink-0 shadow-sm shadow-brand-green/50"></div>
                                        <div>
                                            <p class="text-sm font-semibold text-slate-800 leading-tight">Data Terkini</p>
                                            <p class="text-xs text-slate-500 mt-0.5">Grafik telah disesuaikan secara real-time berdasarkan laporan kepanitiaan.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                `

      // Render HTML terlebih dahulu agar tag <canvas> terbaca oleh DOM
      document.getElementById('pageContent').innerHTML = html
      if (typeof lucide !== 'undefined') lucide.createIcons()

      // Init chart setelah canvas pasti ada di DOM
      initChart(chartData, totalSelesai, totalOnProgress, totalBelum)
    })
    .catch((err) => {
      // Menangani error jika apiCall gagal
      showToast('Gagal memuat grafik monitoring dashboard', 'error')
      console.error(err)
    })
    .finally(() => {
      // Menyembunyikan loader di akhir proses, sukses maupun gagal
      hideLoader()
    })
}

function initChart(chartData, totalSelesai, totalOnProgress, totalBelum) {
  // Destroy existing charts to prevent overlaps and glitches
  if (window.myDashboardBar) window.myDashboardBar.destroy()
  if (window.myDashboardPie) window.myDashboardPie.destroy()

  // 1. BAR CHART (Monitoring Per Seksi)
  const ctxBar = document.getElementById('progressChart').getContext('2d')
  const labels = Object.keys(chartData)
  const dataSelesai = labels.map((l) => chartData[l].Selesai)
  const dataOnProgress = labels.map((l) => chartData[l].OnProgress)
  const dataBelum = labels.map((l) => chartData[l].Belum)

  window.myDashboardBar = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Selesai',
          data: dataSelesai,
          backgroundColor: '#059669',
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: 'Sedang Proses',
          data: dataOnProgress,
          backgroundColor: '#3b82f6',
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: 'Belum Mulai',
          data: dataBelum,
          backgroundColor: '#cbd5e1',
          borderRadius: 4,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            font: { family: "'Poppins', sans-serif", size: 11 },
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          border: { dash: [4, 4] },
          grid: { color: '#f1f5f9' },
          ticks: {
            stepSize: 1,
            font: { family: "'Poppins', sans-serif" },
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            font: { family: "'Poppins', sans-serif", size: 11 },
          },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          titleFont: { family: "'Poppins', sans-serif", size: 13 },
          bodyFont: { family: "'Poppins', sans-serif", size: 12 },
          cornerRadius: 8,
        },
      },
    },
  })

  // 2. DOUGHNUT CHART (Overall Status)
  const ctxPie = document.getElementById('overallPieChart').getContext('2d')
  window.myDashboardPie = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['Selesai', 'On Progress', 'Belum'],
      datasets: [
        {
          data: [totalSelesai, totalOnProgress, totalBelum],
          backgroundColor: ['#059669', '#3b82f6', '#cbd5e1'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 10,
          bodyFont: { family: "'Poppins', sans-serif", size: 12 },
          cornerRadius: 8,
        },
      },
    },
  })
}
// ==========================================
// FITUR AGENDA & RUNDOWN ACARA
// ==========================================
async function renderAgenda() {
  showLoader('Memuat timeline agenda...')
  try {
    const res = await apiCall('getData', { sheetName: 'Agenda' })
    let data = res.data

    // Sortir otomatis berdasarkan tanggal
    data.sort((a, b) => {
      let dateA = new Date(a.Tanggal).getTime()
      let dateB = new Date(b.Tanggal).getTime()
      return dateA - dateB
    })

    let totalAgenda = data.length
    let selesai = 0
    let onProgress = 0

    data.forEach((item) => {
      let status = (item.Status || '').trim()
      if (status === 'Selesai') selesai++
      else if (status === 'On Progress') onProgress++
    })

    const headers =
      data.length > 0
        ? Object.keys(data[0]).filter((k) => k !== 'ID')
        : [
            'NamaKegiatan',
            'Tanggal',
            'Waktu',
            'PenanggungJawab',
            'Status',
            'Keterangan',
          ]

    let html = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 animate-fade-in">
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-indigo-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3"><i data-lucide="calendar-days" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Agenda</p>
                            <h3 class="text-xl md:text-2xl font-bold text-indigo-600 mt-1">${totalAgenda} Kegiatan</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-blue-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3"><i data-lucide="loader" class="w-5 h-5 animate-spin-slow"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Sedang Berjalan</p>
                            <h3 class="text-xl md:text-2xl font-bold text-blue-600 mt-1">${onProgress} Kegiatan</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-emerald-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3"><i data-lucide="check-circle-2" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Telah Selesai</p>
                            <h3 class="text-xl md:text-2xl font-bold text-emerald-600 mt-1">${selesai} Kegiatan</h3>
                        </div>
                    </div>

                    <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 animate-fade-in" style="animation-delay: 0.1s">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div><h3 class="font-bold text-lg text-slate-800 flex items-center gap-2"><div class="w-1.5 h-6 bg-indigo-500 rounded-full"></div> Rundown & Timeline Acara</h3></div>
                            <button onclick="formAgenda()" class="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold btn-depth flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Agenda</button>
                        </div>
                        
                        <div class="w-full overflow-x-auto rounded-xl border border-slate-100">
                            <table class="w-full text-left text-sm whitespace-nowrap min-w-max">
                                <thead class="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                                    <tr>
                                        ${headers.map((h) => `<th class="px-4 py-3 border-b border-slate-200">${h}</th>`).join('')}
                                        <th class="px-4 py-3 border-b border-slate-200 text-center w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody class="text-slate-700 divide-y divide-slate-100">
                                    ${data
                                      .map(
                                        (row) => `
                                        <tr class="hover:bg-indigo-50/30 transition-colors">
                                            ${headers
                                              .map((h) => {
                                                let val = row[h] || '-'

                                                if (h === 'NamaKegiatan')
                                                  val = `<span class="font-bold text-slate-800 text-sm">${val}</span>`
                                                else if (
                                                  h === 'Tanggal' &&
                                                  val !== '-'
                                                )
                                                  val = `<span class="flex items-center gap-1.5 font-medium"><i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i> ${new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>`
                                                else if (h === 'Waktu')
                                                  val = `<span class="flex items-center gap-1.5 font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md w-max"><i data-lucide="clock" class="w-3 h-3"></i> ${val}</span>`
                                                else if (
                                                  h === 'PenanggungJawab'
                                                )
                                                  val = `<span class="text-xs text-slate-600 font-medium"><i data-lucide="user" class="w-3 h-3 inline pb-0.5 text-slate-400"></i> ${val}</span>`
                                                else if (
                                                  h === 'Keterangan' &&
                                                  val !== '-'
                                                )
                                                  val = `<span class="text-xs text-slate-500 max-w-[200px] truncate block" title="${val}">${val}</span>`
                                                else if (h === 'Status') {
                                                  let colorClass =
                                                    'bg-slate-100 text-slate-600'
                                                  if (val === 'Selesai')
                                                    colorClass =
                                                      'bg-emerald-100 text-emerald-700'
                                                  else if (
                                                    val === 'On Progress'
                                                  )
                                                    colorClass =
                                                      'bg-blue-100 text-blue-700'
                                                  else if (val === 'Belum')
                                                    colorClass =
                                                      'bg-red-50 text-red-600 border border-red-100'
                                                  val = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${colorClass}">${val}</span>`
                                                }
                                                return `<td class="px-4 py-3 align-middle">${val}</td>`
                                              })
                                              .join('')}
                                            <td class="px-4 py-3 text-center align-middle">
                                                <button onclick="formAgenda('${JSON.stringify(row).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}')" class="p-1.5 text-slate-400 bg-slate-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors" title="Edit Agenda"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                            </td>
                                        </tr>
                                    `,
                                      )
                                      .join('')}
                                    ${data.length === 0 ? `<tr><td colspan="${headers.length + 1}" class="text-center py-8 text-slate-400 text-sm">Belum ada agenda kegiatan yang dijadwalkan.</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `
    document.getElementById('pageContent').innerHTML = html
    lucide.createIcons()
  } catch (err) {
    showToast('Gagal memuat Data Agenda', 'error')
  }
  hideLoader()
}

function formAgenda(itemJsonStr = null) {
  let item = null
  if (itemJsonStr) {
    item = JSON.parse(
      itemJsonStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'"),
    )
  }

  const isEdit = !!item
  const statusOptions = ['Belum', 'On Progress', 'Selesai']

  // Format existing date to YYYY-MM-DD
  let formattedDate = ''
  if (item && item.Tanggal) {
    try {
      const d = new Date(item.Tanggal)
      formattedDate = d.toISOString().split('T')[0]
    } catch (e) {}
  } else if (!item) {
    // If new, set default to the general event date if it exists
    if (STATE.settings.TanggalAcara) {
      try {
        formattedDate = new Date(STATE.settings.TanggalAcara)
          .toISOString()
          .split('T')[0]
      } catch (e) {}
    } else {
      formattedDate = new Date().toISOString().split('T')[0]
    }
  }

  const html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nama Agenda / Kegiatan *</label>
                        <input type="text" id="fag_nama" value="${item ? item.NamaKegiatan : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm font-semibold" placeholder="Contoh: Pembukaan & Tilawah">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase flex items-center gap-1.5"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> Tanggal *</label>
                            <input type="date" id="fag_tanggal" value="${formattedDate}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase flex items-center gap-1.5"><i data-lucide="clock" class="w-3.5 h-3.5"></i> Waktu / Jam</label>
                            <input type="time" id="fag_waktu" value="${item ? item.Waktu || '' : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Status Agenda</label>
                            <select id="fag_status" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white font-medium">
                                ${statusOptions.map((k) => `<option value="${k}" ${item && item.Status === k ? 'selected' : ''}>${k}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Penanggung Jawab (PIC)</label>
                            <input type="text" id="fag_pj" value="${item ? item.PenanggungJawab : STATE.user.Nama}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-slate-50" placeholder="Nama MC/Panitia">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Keterangan Tambahan</label>
                        <input type="text" id="fag_keterangan" value="${item ? item.Keterangan || '' : ''}" placeholder="Cttn: Durasi 15 menit, persiapan sound..." class="w-full px-4 py-2.5 rounded-xl input-premium text-sm">
                    </div>
                </div>
            `

  openModal(
    isEdit ? 'Update Status Agenda' : 'Tambah Jadwal Rundown',
    html,
    async () => {
      const dataAgenda = {
        NamaKegiatan: document.getElementById('fag_nama').value.trim(),
        Tanggal: document.getElementById('fag_tanggal').value,
        Waktu: document.getElementById('fag_waktu').value,
        PenanggungJawab: document.getElementById('fag_pj').value.trim(),
        Status: document.getElementById('fag_status').value,
        Keterangan: document.getElementById('fag_keterangan').value.trim(),
      }

      if (!dataAgenda.NamaKegiatan || !dataAgenda.Tanggal)
        return showToast('Nama Kegiatan dan Tanggal wajib diisi', 'error')

      showLoader(
        isEdit
          ? 'Menyimpan pembaruan agenda...'
          : 'Menambahkan jadwal acara...',
      )
      try {
        if (isEdit) {
          await apiCall('updateRow', {
            sheetName: 'Agenda',
            id: item.ID,
            data: dataAgenda,
          })
        } else {
          await apiCall('insertRow', { sheetName: 'Agenda', data: dataAgenda })
        }
        closeModal()
        showToast(
          `Jadwal Agenda Berhasil ${isEdit ? 'Diperbarui' : 'Ditambahkan'}`,
          'success',
        )
        renderAgenda()
      } catch (e) {
        showToast('Gagal menyimpan agenda', 'error')
      }
      hideLoader()
    },
  )
}

// ==========================================
// FITUR DOKUMENTASI (HUMAS)
// ==========================================
async function renderDokumentasi() {
  showLoader('Memuat data Dokumentasi...')
  try {
    const res = await apiCall('getData', { sheetName: 'Dokumentasi' })
    const data = res.data

    let totalKegiatan = data.length
    let adaFoto = 0
    let adaVideo = 0

    data.forEach((item) => {
      if (item.LinkFoto && item.LinkFoto !== '-' && item.LinkFoto.trim() !== '')
        adaFoto++
      if (
        item.LinkVideo &&
        item.LinkVideo !== '-' &&
        item.LinkVideo.trim() !== ''
      )
        adaVideo++
    })

    const headers =
      data.length > 0
        ? Object.keys(data[0]).filter((k) => k !== 'ID')
        : ['Tanggal', 'Kegiatan', 'LinkFoto', 'LinkVideo', 'PIC_Humas']

    let html = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 animate-fade-in">
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-cyan-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-3"><i data-lucide="folder-open" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Kegiatan</p>
                            <h3 class="text-xl md:text-2xl font-bold text-cyan-600 mt-1">${totalKegiatan} Momen</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-pink-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-3"><i data-lucide="image" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Dokumentasi Foto</p>
                            <h3 class="text-xl md:text-2xl font-bold text-pink-600 mt-1">${adaFoto} Album</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-indigo-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3"><i data-lucide="video" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Dokumentasi Video</p>
                            <h3 class="text-xl md:text-2xl font-bold text-indigo-600 mt-1">${adaVideo} Video</h3>
                        </div>
                    </div>

                    <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 animate-fade-in" style="animation-delay: 0.1s">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div><h3 class="font-bold text-lg text-slate-800 flex items-center gap-2"><div class="w-1.5 h-6 bg-cyan-500 rounded-full"></div> Arsip Dokumentasi</h3></div>
                            <button onclick="formDokumentasi()" class="w-full sm:w-auto bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold btn-depth flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Arsip</button>
                        </div>
                        
                        <div class="w-full overflow-x-auto rounded-xl border border-slate-100">
                            <table class="w-full text-left text-sm whitespace-nowrap min-w-max">
                                <thead class="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                                    <tr>
                                        ${headers.map((h) => `<th class="px-4 py-3 border-b border-slate-200">${h.replace('PIC_Humas', 'PIC')}</th>`).join('')}
                                        <th class="px-4 py-3 border-b border-slate-200 text-center w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody class="text-slate-700 divide-y divide-slate-100">
                                    ${data
                                      .map(
                                        (row) => `
                                        <tr class="hover:bg-cyan-50/30 transition-colors">
                                            ${headers
                                              .map((h) => {
                                                let val = row[h] || '-'

                                                if (
                                                  h === 'Tanggal' &&
                                                  val !== '-'
                                                )
                                                  val = new Date(
                                                    val,
                                                  ).toLocaleDateString(
                                                    'id-ID',
                                                    {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                    },
                                                  )
                                                else if (h === 'Kegiatan')
                                                  val = `<span class="font-bold text-slate-800">${val}</span>`
                                                else if (h === 'PIC_Humas')
                                                  val = `<span class="text-xs text-slate-500"><i data-lucide="user" class="w-3 h-3 inline"></i> ${val}</span>`
                                                else if (h === 'LinkFoto') {
                                                  val =
                                                    val !== '-' &&
                                                    val.trim() !== ''
                                                      ? `<a href="${val}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-xs font-semibold hover:bg-pink-100 transition-colors"><i data-lucide="image" class="w-3.5 h-3.5"></i> Lihat Foto</a>`
                                                      : `<span class="text-xs text-slate-400 italic">Belum ada</span>`
                                                } else if (h === 'LinkVideo') {
                                                  val =
                                                    val !== '-' &&
                                                    val.trim() !== ''
                                                      ? `<a href="${val}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"><i data-lucide="video" class="w-3.5 h-3.5"></i> Lihat Video</a>`
                                                      : `<span class="text-xs text-slate-400 italic">Belum ada</span>`
                                                }
                                                return `<td class="px-4 py-3">${val}</td>`
                                              })
                                              .join('')}
                                            <td class="px-4 py-3 text-center">
                                                <button onclick="formDokumentasi('${JSON.stringify(row).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}')" class="p-1.5 text-slate-400 bg-slate-100 rounded-lg hover:bg-cyan-600 hover:text-white transition-colors" title="Edit Arsip"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                            </td>
                                        </tr>
                                    `,
                                      )
                                      .join('')}
                                    ${data.length === 0 ? `<tr><td colspan="${headers.length + 1}" class="text-center py-8 text-slate-400 text-sm">Belum ada arsip dokumentasi.</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `
    document.getElementById('pageContent').innerHTML = html
    lucide.createIcons()
  } catch (err) {
    showToast('Gagal memuat Data Dokumentasi', 'error')
  }
  hideLoader()
}

function formDokumentasi(itemJsonStr = null) {
  let item = null
  if (itemJsonStr) {
    item = JSON.parse(
      itemJsonStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'"),
    )
  }

  const isEdit = !!item

  // Format existing date to YYYY-MM-DD for the date input
  let formattedDate = ''
  if (item && item.Tanggal) {
    try {
      const d = new Date(item.Tanggal)
      formattedDate = d.toISOString().split('T')[0]
    } catch (e) {}
  } else if (!item) {
    formattedDate = new Date().toISOString().split('T')[0]
  }

  const html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nama Kegiatan / Momen *</label>
                        <input type="text" id="fdk_kegiatan" value="${item ? item.Kegiatan : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm font-semibold" placeholder="Contoh: Pembukaan & Sambutan">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Tanggal Pelaksanaan *</label>
                            <input type="date" id="fdk_tanggal" value="${formattedDate}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">PIC Humas / Fotografer</label>
                            <input type="text" id="fdk_pic" value="${item ? item.PIC_Humas : STATE.user.Nama}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-slate-50">
                        </div>
                    </div>
                    <hr class="border-slate-100 my-2">
                    <div>
                        <label class="block text-xs font-bold text-pink-600 mb-1.5 uppercase flex items-center gap-1.5"><i data-lucide="image" class="w-3.5 h-3.5"></i> Link Folder / File Foto</label>
                        <input type="url" id="fdk_foto" value="${item ? (item.LinkFoto !== '-' ? item.LinkFoto : '') : ''}" placeholder="https://drive.google.com/..." class="w-full px-4 py-2.5 rounded-xl input-premium text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-indigo-600 mb-1.5 uppercase flex items-center gap-1.5"><i data-lucide="video" class="w-3.5 h-3.5"></i> Link Folder / File Video</label>
                        <input type="url" id="fdk_video" value="${item ? (item.LinkVideo !== '-' ? item.LinkVideo : '') : ''}" placeholder="https://youtube.com/... atau Drive" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm">
                    </div>
                </div>
            `

  openModal(
    isEdit ? 'Update Arsip Dokumentasi' : 'Tambah Arsip Baru',
    html,
    async () => {
      const dataDokumentasi = {
        Tanggal: document.getElementById('fdk_tanggal').value,
        Kegiatan: document.getElementById('fdk_kegiatan').value.trim(),
        LinkFoto: document.getElementById('fdk_foto').value.trim() || '-',
        LinkVideo: document.getElementById('fdk_video').value.trim() || '-',
        PIC_Humas: document.getElementById('fdk_pic').value,
      }

      if (!dataDokumentasi.Kegiatan || !dataDokumentasi.Tanggal)
        return showToast('Nama Kegiatan dan Tanggal wajib diisi', 'error')

      showLoader(isEdit ? 'Mengupdate arsip...' : 'Menyimpan arsip baru...')
      try {
        if (isEdit) {
          await apiCall('updateRow', {
            sheetName: 'Dokumentasi',
            id: item.ID,
            data: dataDokumentasi,
          })
        } else {
          await apiCall('insertRow', {
            sheetName: 'Dokumentasi',
            data: dataDokumentasi,
          })
        }
        closeModal()
        showToast(
          `Arsip Dokumentasi Berhasil ${isEdit ? 'Diperbarui' : 'Ditambahkan'}`,
          'success',
        )
        renderDokumentasi()
      } catch (e) {
        showToast('Gagal menyimpan dokumentasi', 'error')
      }
      hideLoader()
    },
  )
}

// ==========================================
// FITUR TAMU VIP (HUMAS)
// ==========================================
async function renderTamuVIP() {
  showLoader('Memuat data Tamu VIP...')
  try {
    const res = await apiCall('getData', { sheetName: 'TamuVIP' })
    const data = res.data

    let totalVIP = data.length
    let hadir = 0
    let belumKonfirmasi = 0

    data.forEach((item) => {
      let status = (item.StatusKonfirmasi || '').toLowerCase()
      if (status === 'hadir') hadir++
      else if (status === 'belum konfirmasi' || status === '') belumKonfirmasi++
    })

    const headers =
      data.length > 0
        ? Object.keys(data[0]).filter((k) => k !== 'ID')
        : ['Nama', 'Instansi', 'Kebutuhan', 'StatusKonfirmasi', 'PIC_Humas']

    let html = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 animate-fade-in">
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-purple-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3"><i data-lucide="users" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Undangan VIP</p>
                            <h3 class="text-xl md:text-2xl font-bold text-purple-600 mt-1">${totalVIP} Orang</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-emerald-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3"><i data-lucide="check-circle" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Konfirmasi Hadir</p>
                            <h3 class="text-xl md:text-2xl font-bold text-emerald-600 mt-1">${hadir} Orang</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-amber-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3"><i data-lucide="clock" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Belum Konfirmasi</p>
                            <h3 class="text-xl md:text-2xl font-bold text-amber-600 mt-1">${belumKonfirmasi} Orang</h3>
                        </div>
                    </div>

                    <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 animate-fade-in" style="animation-delay: 0.1s">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div><h3 class="font-bold text-lg text-slate-800 flex items-center gap-2"><div class="w-1.5 h-6 bg-purple-500 rounded-full"></div> Daftar Tamu VIP</h3></div>
                            <button onclick="formTamuVIP()" class="w-full sm:w-auto bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold btn-depth flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"><i data-lucide="plus" class="w-4 h-4"></i> Tambah VIP</button>
                        </div>
                        
                        <div class="w-full overflow-x-auto rounded-xl border border-slate-100">
                            <table class="w-full text-left text-sm whitespace-nowrap min-w-max">
                                <thead class="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                                    <tr>
                                        ${headers.map((h) => `<th class="px-4 py-3 border-b border-slate-200">${h.replace('StatusKonfirmasi', 'Status').replace('PIC_Humas', 'PIC')}</th>`).join('')}
                                        <th class="px-4 py-3 border-b border-slate-200 text-center w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody class="text-slate-700 divide-y divide-slate-100">
                                    ${data
                                      .map(
                                        (row) => `
                                        <tr class="hover:bg-purple-50/30 transition-colors">
                                            ${headers
                                              .map((h) => {
                                                let val = row[h] || '-'

                                                if (h === 'Nama')
                                                  val = `<span class="font-bold text-slate-800">${val}</span>`
                                                else if (h === 'Instansi')
                                                  val = `<span class="text-slate-600 font-medium">${val}</span>`
                                                else if (
                                                  h === 'Kebutuhan' &&
                                                  val !== '-'
                                                )
                                                  val = `<span class="text-xs text-slate-500 max-w-[200px] truncate block" title="${val}"><i data-lucide="info" class="w-3 h-3 inline text-brand-gold"></i> ${val}</span>`
                                                else if (h === 'PIC_Humas')
                                                  val = `<span class="text-xs text-slate-500"><i data-lucide="user" class="w-3 h-3 inline"></i> ${val}</span>`
                                                else if (
                                                  h === 'StatusKonfirmasi'
                                                ) {
                                                  let colorClass =
                                                    'bg-slate-100 text-slate-600'
                                                  if (val === 'Hadir')
                                                    colorClass =
                                                      'bg-emerald-100 text-emerald-700'
                                                  else if (
                                                    val === 'Tidak Hadir'
                                                  )
                                                    colorClass =
                                                      'bg-red-100 text-red-700'
                                                  else if (val === 'Diwakilkan')
                                                    colorClass =
                                                      'bg-blue-100 text-blue-700'
                                                  else if (
                                                    val === 'Belum Konfirmasi'
                                                  )
                                                    colorClass =
                                                      'bg-amber-100 text-amber-700'
                                                  val = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${colorClass}">${val}</span>`
                                                }
                                                return `<td class="px-4 py-3">${val}</td>`
                                              })
                                              .join('')}
                                            <td class="px-4 py-3 text-center">
                                                <button onclick="formTamuVIP('${JSON.stringify(row).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}')" class="p-1.5 text-slate-400 bg-slate-100 rounded-lg hover:bg-purple-600 hover:text-white transition-colors" title="Edit VIP"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                            </td>
                                        </tr>
                                    `,
                                      )
                                      .join('')}
                                    ${data.length === 0 ? `<tr><td colspan="${headers.length + 1}" class="text-center py-8 text-slate-400 text-sm">Belum ada daftar tamu VIP.</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `
    document.getElementById('pageContent').innerHTML = html
    lucide.createIcons()
  } catch (err) {
    showToast('Gagal memuat Data Tamu VIP', 'error')
  }
  hideLoader()
}

function formTamuVIP(itemJsonStr = null) {
  let item = null
  if (itemJsonStr) {
    item = JSON.parse(
      itemJsonStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'"),
    )
  }

  const isEdit = !!item
  const statusOptions = [
    'Belum Konfirmasi',
    'Hadir',
    'Tidak Hadir',
    'Diwakilkan',
  ]

  const html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nama Lengkap & Gelar VIP *</label>
                        <input type="text" id="fv_nama" value="${item ? item.Nama : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm font-semibold" placeholder="Contoh: KH. Ahmad Dahlan">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Instansi / Jabatan *</label>
                        <input type="text" id="fv_instansi" value="${item ? item.Instansi : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm" placeholder="MUI Kota / Tokoh Masyarakat">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Status Kehadiran</label>
                            <select id="fv_status" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white">
                                ${statusOptions.map((k) => `<option value="${k}" ${item && item.StatusKonfirmasi === k ? 'selected' : ''}>${k}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">PIC Humas</label>
                            <input type="text" id="fv_pic" value="${item ? item.PIC_Humas : STATE.user.Nama}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-slate-50">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Catatan Kebutuhan Khusus</label>
                        <input type="text" id="fv_kebutuhan" value="${item ? item.Kebutuhan || '' : ''}" placeholder="Cttn: Kursi roda / Menu vegetarian" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm">
                    </div>
                </div>
            `

  openModal(isEdit ? 'Update Data VIP' : 'Tambah Tamu VIP', html, async () => {
    const dataVIP = {
      Nama: document.getElementById('fv_nama').value.trim(),
      Instansi: document.getElementById('fv_instansi').value.trim(),
      Kebutuhan: document.getElementById('fv_kebutuhan').value,
      StatusKonfirmasi: document.getElementById('fv_status').value,
      PIC_Humas: document.getElementById('fv_pic').value,
    }

    if (!dataVIP.Nama || !dataVIP.Instansi)
      return showToast('Nama dan Instansi wajib diisi', 'error')

    showLoader(isEdit ? 'Mengupdate data...' : 'Menyimpan tamu VIP...')
    try {
      if (isEdit) {
        await apiCall('updateRow', {
          sheetName: 'TamuVIP',
          id: item.ID,
          data: dataVIP,
        })
      } else {
        await apiCall('insertRow', { sheetName: 'TamuVIP', data: dataVIP })
      }
      closeModal()
      showToast(
        `Data VIP Berhasil ${isEdit ? 'Diperbarui' : 'Ditambahkan'}`,
        'success',
      )
      renderTamuVIP()
    } catch (e) {
      showToast('Gagal menyimpan data VIP', 'error')
    }
    hideLoader()
  })
}

// ==========================================
// FITUR KONSUMSI
// ==========================================
async function renderKonsumsi() {
  showLoader('Merekap data konsumsi...')
  try {
    const res = await apiCall('getData', { sheetName: 'Konsumsi' })
    const data = res.data

    let totalMenu = data.length
    let totalPorsi = 0
    let sudahSaji = 0

    data.forEach((item) => {
      totalPorsi += Number(item.JumlahPorsi) || 0
      if (item.Status === 'Sudah Saji') sudahSaji++
    })

    const headers =
      data.length > 0
        ? Object.keys(data[0]).filter((k) => k !== 'ID')
        : [
            'Menu',
            'JumlahPorsi',
            'WaktuSaji',
            'PenanggungJawab',
            'Status',
            'Catatan',
          ]

    let html = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 animate-fade-in">
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-orange-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3"><i data-lucide="utensils" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Jenis Menu</p>
                            <h3 class="text-xl md:text-2xl font-bold text-orange-600 mt-1">${totalMenu} Macam</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-blue-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3"><i data-lucide="users" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Keseluruhan Porsi</p>
                            <h3 class="text-xl md:text-2xl font-bold text-blue-600 mt-1">${totalPorsi} Porsi</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-emerald-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3"><i data-lucide="check-circle-2" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Menu Siap Saji</p>
                            <h3 class="text-xl md:text-2xl font-bold text-emerald-600 mt-1">${sudahSaji} / ${totalMenu} Menu</h3>
                        </div>
                    </div>

                    <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 animate-fade-in" style="animation-delay: 0.1s">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div><h3 class="font-bold text-lg text-slate-800 flex items-center gap-2"><div class="w-1.5 h-6 bg-orange-500 rounded-full"></div> Data Daftar Konsumsi</h3></div>
                            <button onclick="formKonsumsi()" class="w-full sm:w-auto bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold btn-depth flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Menu</button>
                        </div>
                        
                        <div class="w-full overflow-x-auto rounded-xl border border-slate-100">
                            <table class="w-full text-left text-sm whitespace-nowrap min-w-max">
                                <thead class="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                                    <tr>
                                        ${headers.map((h) => `<th class="px-4 py-3 border-b border-slate-200">${h}</th>`).join('')}
                                        <th class="px-4 py-3 border-b border-slate-200 text-center w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody class="text-slate-700 divide-y divide-slate-100">
                                    ${data
                                      .map(
                                        (row) => `
                                        <tr class="hover:bg-orange-50/30 transition-colors">
                                            ${headers
                                              .map((h) => {
                                                let val = row[h] || '-'

                                                if (h === 'Menu')
                                                  val = `<span class="font-bold text-slate-800">${val}</span>`
                                                else if (h === 'JumlahPorsi')
                                                  val = `<span class="font-semibold text-blue-600">${val} Porsi</span>`
                                                else if (
                                                  h === 'Catatan' &&
                                                  val !== '-'
                                                )
                                                  val = `<span class="text-xs text-slate-500 max-w-[200px] truncate block" title="${val}"><i data-lucide="info" class="w-3 h-3 inline text-brand-gold"></i> ${val}</span>`
                                                else if (h === 'Status') {
                                                  let colorClass =
                                                    'bg-slate-100 text-slate-600'
                                                  if (val === 'Sudah Saji')
                                                    colorClass =
                                                      'bg-emerald-100 text-emerald-700'
                                                  else if (val === 'Sudah Beli')
                                                    colorClass =
                                                      'bg-blue-100 text-blue-700'
                                                  else if (val === 'Belum Beli')
                                                    colorClass =
                                                      'bg-red-100 text-red-700'
                                                  val = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${colorClass}">${val}</span>`
                                                }
                                                return `<td class="px-4 py-3">${val}</td>`
                                              })
                                              .join('')}
                                            <td class="px-4 py-3 text-center">
                                                <button onclick="formKonsumsi('${JSON.stringify(row).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}')" class="p-1.5 text-slate-400 bg-slate-100 rounded-lg hover:bg-orange-500 hover:text-white transition-colors" title="Edit Item"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                            </td>
                                        </tr>
                                    `,
                                      )
                                      .join('')}
                                    ${data.length === 0 ? `<tr><td colspan="${headers.length + 1}" class="text-center py-8 text-slate-400 text-sm">Belum ada daftar menu konsumsi.</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `
    document.getElementById('pageContent').innerHTML = html
    lucide.createIcons()
  } catch (err) {
    showToast('Gagal memuat Data Konsumsi', 'error')
  }
  hideLoader()
}

function formKonsumsi(itemJsonStr = null) {
  let item = null
  if (itemJsonStr) {
    item = JSON.parse(
      itemJsonStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'"),
    )
  }

  const isEdit = !!item
  const statusOptions = ['Belum Beli', 'Sudah Beli', 'Sudah Saji']

  const html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nama Menu Makanan / Minuman *</label>
                        <input type="text" id="fko_menu" value="${item ? item.Menu : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm font-semibold" placeholder="Contoh: Nasi Kotak VIP / Aqua Gelas">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Jumlah Porsi *</label>
                            <input type="number" id="fko_jumlah" value="${item ? item.JumlahPorsi : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm" placeholder="150">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Waktu Saji</label>
                            <input type="text" id="fko_waktu" value="${item ? item.WaktuSaji || '' : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm" placeholder="Pagi / Siang / VIP">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Status Siap</label>
                            <select id="fko_status" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white">
                                ${statusOptions.map((k) => `<option value="${k}" ${item && item.Status === k ? 'selected' : ''}>${k}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Penanggung Jawab</label>
                            <input type="text" id="fko_pj" value="${item ? item.PenanggungJawab : STATE.user.Nama}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-slate-50">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Catatan / Alergi</label>
                        <input type="text" id="fko_catatan" value="${item ? item.Catatan || '' : ''}" placeholder="Cttn: Tanpa MSG / Estimasi budget 2jt" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm">
                    </div>
                </div>
            `

  openModal(
    isEdit ? 'Update Menu Konsumsi' : 'Tambah Menu Baru',
    html,
    async () => {
      const dataKonsumsi = {
        Menu: document.getElementById('fko_menu').value.trim(),
        JumlahPorsi: document.getElementById('fko_jumlah').value,
        WaktuSaji: document.getElementById('fko_waktu').value,
        PenanggungJawab: document.getElementById('fko_pj').value,
        Status: document.getElementById('fko_status').value,
        Catatan: document.getElementById('fko_catatan').value,
      }

      if (!dataKonsumsi.Menu || !dataKonsumsi.JumlahPorsi)
        return showToast('Menu dan Jumlah Porsi wajib diisi', 'error')

      showLoader(isEdit ? 'Mengupdate konsumsi...' : 'Menyimpan menu baru...')
      try {
        if (isEdit) {
          await apiCall('updateRow', {
            sheetName: 'Konsumsi',
            id: item.ID,
            data: dataKonsumsi,
          })
        } else {
          await apiCall('insertRow', {
            sheetName: 'Konsumsi',
            data: dataKonsumsi,
          })
        }
        closeModal()
        showToast(
          `Menu Konsumsi Berhasil ${isEdit ? 'Diperbarui' : 'Ditambahkan'}`,
          'success',
        )
        renderKonsumsi()
      } catch (e) {
        showToast('Gagal menyimpan konsumsi', 'error')
      }
      hideLoader()
    },
  )
}

// ==========================================
// FITUR KEUANGAN & BENDAHARA
// ==========================================
async function renderKeuangan() {
  showLoader('Memuat data dan hitung saldo...')
  try {
    const res = await apiCall('getData', { sheetName: 'Keuangan', role: null })
    const data = res.data

    let totalPemasukan = 0
    let totalPengeluaran = 0
    data.forEach((row) => {
      totalPemasukan += Number(row.Pemasukan) || 0
      totalPengeluaran += Number(row.Pengeluaran) || 0
    })
    let saldoAkhir = totalPemasukan - totalPengeluaran

    const headers =
      data.length > 0
        ? Object.keys(data[0]).filter((k) => k !== 'ID')
        : [
            'Tanggal',
            'Kategori',
            'Keterangan',
            'Pemasukan',
            'Pengeluaran',
            'PIC',
          ]

    let html = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 animate-fade-in">
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-emerald-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3"><i data-lucide="arrow-down-to-line" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Pemasukan</p>
                            <h3 class="text-xl md:text-2xl font-bold text-emerald-600 mt-1">${formatRupiah(totalPemasukan)}</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-red-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3"><i data-lucide="arrow-up-from-line" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Pengeluaran</p>
                            <h3 class="text-xl md:text-2xl font-bold text-red-600 mt-1">${formatRupiah(totalPengeluaran)}</h3>
                        </div>
                        <div class="bg-gradient-to-br from-brand-gold to-amber-500 p-5 rounded-3xl shadow-card text-white relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3"><i data-lucide="wallet" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-amber-100 uppercase tracking-wide">Saldo Akhir</p>
                            <h3 class="text-xl md:text-3xl font-bold mt-1 shadow-sm">${formatRupiah(saldoAkhir)}</h3>
                        </div>
                    </div>
                    <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 animate-fade-in" style="animation-delay: 0.1s">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div><h3 class="font-bold text-lg text-slate-800 flex items-center gap-2"><div class="w-1.5 h-6 bg-brand-gold rounded-full"></div> Histori Transaksi</h3></div>
                            <button onclick="formTambahKeuangan()" class="w-full sm:w-auto bg-brand-gold text-white px-5 py-2.5 rounded-xl text-sm font-semibold btn-depth flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20"><i data-lucide="plus" class="w-4 h-4"></i> Catat Transaksi</button>
                        </div>
                        <div class="w-full overflow-x-auto rounded-xl border border-slate-100">
                            <table class="w-full text-left text-sm whitespace-nowrap min-w-max">
                                <thead class="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider"><tr>${headers.map((h) => `<th class="px-4 py-3 border-b border-slate-200">${h}</th>`).join('')}</tr></thead>
                                <tbody class="text-slate-700 divide-y divide-slate-100">
                                    ${data
                                      .map(
                                        (row) => `
                                        <tr class="hover:bg-amber-50/50 transition-colors">
                                            ${headers
                                              .map((h) => {
                                                let val = row[h]
                                                if (h === 'Tanggal')
                                                  val = val
                                                    ? new Date(
                                                        val,
                                                      ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric',
                                                        },
                                                      )
                                                    : '-'
                                                if (h === 'Pemasukan')
                                                  val =
                                                    val && Number(val) > 0
                                                      ? `<span class="text-emerald-600 font-bold">${formatRupiah(val)}</span>`
                                                      : '-'
                                                else if (h === 'Pengeluaran')
                                                  val =
                                                    val && Number(val) > 0
                                                      ? `<span class="text-red-600 font-bold">${formatRupiah(val)}</span>`
                                                      : '-'
                                                else if (h === 'Kategori')
                                                  val = `<span class="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold">${val}</span>`
                                                else if (h === 'Bukti')
                                                  val = val
                                                    ? `<a href="${val}" target="_blank" class="text-blue-500 hover:underline flex items-center gap-1"><i data-lucide="link" class="w-3 h-3"></i> Bukti</a>`
                                                    : '-'
                                                return `<td class="px-4 py-3">${val || '-'}</td>`
                                              })
                                              .join('')}
                                        </tr>
                                    `,
                                      )
                                      .join('')}
                                    ${data.length === 0 ? `<tr><td colspan="${headers.length}" class="text-center py-8 text-slate-400 text-sm">Belum ada transaksi.</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `
    document.getElementById('pageContent').innerHTML = html
    lucide.createIcons()
  } catch (err) {
    showToast('Gagal memuat Keuangan', 'error')
  }
  hideLoader()
}

function formTambahKeuangan() {
  const html = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Jenis Transaksi *</label><select id="fk_jenis" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white font-bold"><option value="Pemasukan" class="text-emerald-600">💵 Pemasukan (+)</option><option value="Pengeluaran" class="text-red-600">💸 Pengeluaran (-)</option></select></div>
                        <div><label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Tanggal</label><input type="date" id="fk_tanggal" value="${new Date().toISOString().split('T')[0]}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm"></div>
                    </div>
                    <div><label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Kategori</label><select id="fk_kategori" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white"><option>Donasi Jamaah</option><option>Sponsor</option><option>Belanja Konsumsi</option><option>Sewa Perlengkapan</option><option>Honor Mubaligh</option><option>Operasional</option></select></div>
                    <div><label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Jumlah Nominal (Rp) *</label><input type="number" id="fk_nominal" placeholder="1500000" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm font-bold text-brand-gold"></div>
                    <div><label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Keterangan / Rincian</label><input type="text" id="fk_keterangan" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm"></div>
                    <div><label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Link Bukti</label><input type="url" id="fk_bukti" placeholder="https://..." class="w-full px-4 py-2.5 rounded-xl input-premium text-sm"></div>
                    <input type="hidden" id="fk_pic" value="${STATE.user.Nama}">
                </div>
            `
  openModal('Catat Transaksi Keuangan', html, async () => {
    const jenis = document.getElementById('fk_jenis').value
    const nominal = Number(document.getElementById('fk_nominal').value)
    if (!nominal || nominal <= 0)
      return showToast('Nominal harus lebih dari 0', 'error')
    const dataKeuangan = {
      Tanggal: document.getElementById('fk_tanggal').value,
      Role: STATE.user.Role,
      Kategori: document.getElementById('fk_kategori').value,
      Keterangan: document.getElementById('fk_keterangan').value,
      Pemasukan: jenis === 'Pemasukan' ? nominal : 0,
      Pengeluaran: jenis === 'Pengeluaran' ? nominal : 0,
      Bukti: document.getElementById('fk_bukti').value,
      PIC: document.getElementById('fk_pic').value,
    }
    showLoader('Menyimpan Transaksi...')
    try {
      await apiCall('insertRow', { sheetName: 'Keuangan', data: dataKeuangan })
      closeModal()
      showToast('Transaksi Berhasil Dicatat', 'success')
      renderKeuangan()
    } catch (e) {
      showToast('Gagal menyimpan', 'error')
    }
    hideLoader()
  })
}

// ==========================================
// FITUR INVENTARIS
// ==========================================
async function renderInventaris() {
  showLoader('Merekap data inventaris...')
  try {
    const res = await apiCall('getData', { sheetName: 'Inventaris' })
    const data = res.data

    let totalJenis = data.length
    let totalUnit = 0
    let unitBermasalah = 0

    data.forEach((item) => {
      let jml = Number(item.Jumlah) || 0
      totalUnit += jml
      let kondisi = (item.Kondisi || '').toLowerCase()
      if (kondisi.includes('rusak') || kondisi.includes('hilang')) {
        unitBermasalah += jml
      }
    })

    const headers =
      data.length > 0
        ? Object.keys(data[0]).filter((k) => k !== 'ID')
        : ['NamaBarang', 'Jumlah', 'Kondisi', 'PenanggungJawab', 'Keterangan']

    let html = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 animate-fade-in">
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-blue-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3"><i data-lucide="layers" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Jenis Barang</p>
                            <h3 class="text-xl md:text-2xl font-bold text-blue-600 mt-1">${totalJenis} Jenis</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-emerald-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3"><i data-lucide="box" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Unit Aset</p>
                            <h3 class="text-xl md:text-2xl font-bold text-emerald-600 mt-1">${totalUnit} Unit</h3>
                        </div>
                        <div class="bg-white p-5 rounded-3xl shadow-card border border-red-100 relative overflow-hidden">
                            <div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3"><i data-lucide="alert-triangle" class="w-5 h-5"></i></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Bermasalah</p>
                            <h3 class="text-xl md:text-2xl font-bold text-red-600 mt-1">${unitBermasalah} Unit</h3>
                        </div>
                    </div>

                    <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100 animate-fade-in" style="animation-delay: 0.1s">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div><h3 class="font-bold text-lg text-slate-800 flex items-center gap-2"><div class="w-1.5 h-6 bg-brand-green rounded-full"></div> Data Inventaris & Perlengkapan</h3></div>
                            <button onclick="formInventaris()" class="w-full sm:w-auto bg-brand-green text-white px-5 py-2.5 rounded-xl text-sm font-semibold btn-depth flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Aset</button>
                        </div>
                        
                        <div class="w-full overflow-x-auto rounded-xl border border-slate-100">
                            <table class="w-full text-left text-sm whitespace-nowrap min-w-max">
                                <thead class="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                                    <tr>
                                        ${headers.map((h) => `<th class="px-4 py-3 border-b border-slate-200">${h}</th>`).join('')}
                                        <th class="px-4 py-3 border-b border-slate-200 text-center w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody class="text-slate-700 divide-y divide-slate-100">
                                    ${data
                                      .map(
                                        (row) => `
                                        <tr class="hover:bg-slate-50 transition-colors">
                                            ${headers
                                              .map((h) => {
                                                let val = row[h] || '-'

                                                if (h === 'NamaBarang')
                                                  val = `<span class="font-bold text-slate-800">${val}</span>`
                                                else if (h === 'Jumlah')
                                                  val = `<span class="font-semibold">${val}</span>`
                                                else if (h === 'Kondisi') {
                                                  let colorClass =
                                                    'bg-slate-100 text-slate-600'
                                                  let k = val.toLowerCase()
                                                  if (k.includes('baik'))
                                                    colorClass =
                                                      'bg-emerald-100 text-emerald-700'
                                                  else if (
                                                    k.includes('rusak') ||
                                                    k.includes('hilang')
                                                  )
                                                    colorClass =
                                                      'bg-red-100 text-red-700'
                                                  else if (
                                                    k.includes('pinjam') ||
                                                    k.includes('sewa')
                                                  )
                                                    colorClass =
                                                      'bg-blue-100 text-blue-700'
                                                  val = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${colorClass}">${val}</span>`
                                                }
                                                return `<td class="px-4 py-3">${val}</td>`
                                              })
                                              .join('')}
                                            <td class="px-4 py-3 text-center">
                                                <button onclick="formInventaris('${JSON.stringify(row).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}')" class="p-1.5 text-slate-400 bg-slate-100 rounded-lg hover:bg-brand-green hover:text-white transition-colors" title="Edit Item"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                            </td>
                                        </tr>
                                    `,
                                      )
                                      .join('')}
                                    ${data.length === 0 ? `<tr><td colspan="${headers.length + 1}" class="text-center py-8 text-slate-400 text-sm">Belum ada data inventaris.</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `
    document.getElementById('pageContent').innerHTML = html
    lucide.createIcons()
  } catch (err) {
    showToast('Gagal memuat Data Inventaris', 'error')
  }
  hideLoader()
}

function formInventaris(itemJsonStr = null) {
  let item = null
  if (itemJsonStr) {
    item = JSON.parse(
      itemJsonStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'"),
    )
  }

  const isEdit = !!item
  const kondisiOptions = [
    'Baik',
    'Rusak Ringan',
    'Rusak Berat',
    'Pinjam',
    'Hilang',
  ]

  const html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nama Barang / Aset *</label>
                        <input type="text" id="fi_nama" value="${item ? item.NamaBarang : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm font-semibold" placeholder="Contoh: Tenda VIP">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Jumlah *</label>
                            <input type="number" id="fi_jumlah" value="${item ? item.Jumlah : ''}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Kondisi</label>
                            <select id="fi_kondisi" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white">
                                ${kondisiOptions.map((k) => `<option value="${k}" ${item && item.Kondisi === k ? 'selected' : ''}>${k}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Penanggung Jawab</label>
                        <input type="text" id="fi_pj" value="${item ? item.PenanggungJawab : STATE.user.Nama}" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-slate-50">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Keterangan / Lokasi</label>
                        <input type="text" id="fi_keterangan" value="${item ? item.Keterangan || '' : ''}" placeholder="Disimpan di gudang masjid..." class="w-full px-4 py-2.5 rounded-xl input-premium text-sm">
                    </div>
                </div>
            `

  openModal(
    isEdit ? 'Update Inventaris' : 'Tambah Inventaris Baru',
    html,
    async () => {
      const dataInventaris = {
        NamaBarang: document.getElementById('fi_nama').value.trim(),
        Jumlah: document.getElementById('fi_jumlah').value,
        Kondisi: document.getElementById('fi_kondisi').value,
        PenanggungJawab: document.getElementById('fi_pj').value,
        Keterangan: document.getElementById('fi_keterangan').value,
      }
      if (!dataInventaris.NamaBarang || !dataInventaris.Jumlah)
        return showToast('Nama Barang dan Jumlah wajib diisi', 'error')

      showLoader(isEdit ? 'Mengupdate data...' : 'Menyimpan data baru...')
      try {
        if (isEdit)
          await apiCall('updateRow', {
            sheetName: 'Inventaris',
            id: item.ID,
            data: dataInventaris,
          })
        else
          await apiCall('insertRow', {
            sheetName: 'Inventaris',
            data: dataInventaris,
          })
        closeModal()
        showToast(
          `Data Inventaris Berhasil ${isEdit ? 'Diperbarui' : 'Ditambahkan'}`,
          'success',
        )
        renderInventaris()
      } catch (e) {
        showToast('Gagal menyimpan inventaris', 'error')
      }
      hideLoader()
    },
  )
}

// ==========================================
// TUGAS KANBAN & GENERIC TABLE
// ==========================================
async function renderTugas(filterRole = null) {
  showLoader('Memuat daftar tugas...')
  try {
    const res = await apiCall('getData', {
      sheetName: 'Tugas',
      role: filterRole,
    })
    const tugas = res.data
    const html = `
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 animate-fade-in">
                        <div>
                            <h3 class="font-bold text-lg md:text-xl text-slate-800 flex items-center gap-2"><div class="w-1.5 h-6 bg-brand-green rounded-full"></div> Kanban Board Tugas</h3>
                            <p class="text-xs text-slate-500 mt-1 pl-3.5">Pantau progress tugas operasional kepanitiaan</p>
                        </div>
                        ${STATE.user.Role === 'Sekretaris' || STATE.user.Role === 'Ketua' ? `<button onclick="formTambahTugas()" class="w-full md:w-auto bg-brand-green text-white px-5 py-2.5 rounded-xl text-sm font-semibold btn-depth flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Tugas</button>` : ''}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 animate-fade-in" style="animation-delay: 0.1s">
                        <!-- Kolom Belum -->
                        <div class="bg-slate-100/70 rounded-3xl p-4 md:p-5 kanban-col border border-slate-200/60 shadow-inner">
                            <h3 class="font-bold text-slate-700 flex items-center gap-2.5 mb-4 px-1">
                                <div class="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm"></div> Belum Mulai
                                <span class="ml-auto text-xs font-semibold bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full">${tugas.filter((t) => t.Status === 'Belum').length}</span>
                            </h3>
                            <div class="space-y-3">
                                ${genCards(tugas, 'Belum')}
                            </div>
                        </div>

                        <!-- Kolom On Progress -->
                        <div class="bg-blue-50/70 rounded-3xl p-4 md:p-5 kanban-col border border-blue-100 shadow-inner">
                            <h3 class="font-bold text-blue-800 flex items-center gap-2.5 mb-4 px-1">
                                <div class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm animate-pulse"></div> Proses
                                <span class="ml-auto text-xs font-semibold bg-blue-200 text-blue-800 px-2.5 py-0.5 rounded-full">${tugas.filter((t) => t.Status === 'On Progress').length}</span>
                            </h3>
                            <div class="space-y-3">
                                ${genCards(tugas, 'On Progress')}
                            </div>
                        </div>

                        <!-- Kolom Selesai -->
                        <div class="bg-emerald-50/70 rounded-3xl p-4 md:p-5 kanban-col border border-emerald-100 shadow-inner">
                            <h3 class="font-bold text-emerald-800 flex items-center gap-2.5 mb-4 px-1">
                                <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div> Selesai
                                <span class="ml-auto text-xs font-semibold bg-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full">${tugas.filter((t) => t.Status === 'Selesai').length}</span>
                            </h3>
                            <div class="space-y-3">
                                ${genCards(tugas, 'Selesai')}
                            </div>
                        </div>
                    </div>
                `
    document.getElementById('pageContent').innerHTML = html
    lucide.createIcons()
  } catch (err) {
    showToast('Gagal memuat tugas', 'error')
  }
  hideLoader()
}

function genCards(arr, stat) {
  const f = arr.filter((t) => t.Status === stat)
  if (f.length === 0)
    return `<div class="text-xs text-slate-400 text-center italic py-6 border-2 border-dashed border-slate-200 rounded-2xl">Tidak ada tugas</div>`
  return f
    .map((t) => {
      let badgeColor = 'bg-brand-gold/10 text-brand-gold'
      if (t.Role === 'Konsumsi') badgeColor = 'bg-orange-100 text-orange-600'
      if (t.Role === 'Acara') badgeColor = 'bg-indigo-100 text-indigo-600'
      if (t.Role === 'Perlengkapan') badgeColor = 'bg-blue-100 text-blue-600'

      let deadlineClass = 'text-slate-500'
      let bgClass = 'bg-white border-slate-100'

      if (t.Deadline && stat !== 'Selesai') {
        const dl = new Date(t.Deadline).getTime()
        const now = new Date().getTime()
        if (dl - now < 3 * 24 * 60 * 60 * 1000) {
          // < 3 hari
          deadlineClass =
            'text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md'
          bgClass = 'bg-red-50/80 border-red-200 shadow-sm shadow-red-100/50'
        }
      }

      return `
                <div class="${bgClass} p-4 md:p-5 rounded-2xl shadow-card border hover:shadow-md transition-all cursor-pointer relative group btn-depth" onclick="bukaDetailTugas('${JSON.stringify(t).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}')">
                    <div class="flex justify-between items-start mb-2.5">
                        <span class="text-[10px] font-bold uppercase tracking-wider ${badgeColor} px-2 py-1 rounded-lg">${t.Role}</span>
                        ${t.PIC ? `<span class="text-[10px] text-slate-500 font-medium flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"><i data-lucide="user" class="w-3 h-3"></i> ${t.PIC}</span>` : ''}
                    </div>
                    <h4 class="font-semibold text-slate-800 text-sm mb-3 leading-snug">${t.NamaTugas}</h4>
                    <div class="flex justify-between items-center pt-3 border-t border-slate-100/80 mt-auto">
                        <div class="flex items-center gap-1.5 text-[11px] ${deadlineClass}">
                            <i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${t.Deadline ? new Date(t.Deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </div>
                        ${t.Catatan || (t.Bukti && t.Bukti !== '-') ? `<div class="flex items-center gap-1.5 text-brand-green" title="Ada catatan/bukti"><i data-lucide="file-text" class="w-4 h-4"></i></div>` : ''}
                    </div>
                </div>`
    })
    .join('')
}

function loadGenericTable(sheetName) {
  // Placeholder for any other tables not yet converted to custom UI
  showLoader(`Memuat ${sheetName}...`)
  apiCall('getData', { sheetName: sheetName })
    .then((res) => {
      const data = res.data
      const headers =
        data.length > 0
          ? Object.keys(data[0]).filter((k) => k !== 'ID')
          : ['Keterangan', 'Status']

      document.getElementById('pageContent').innerHTML = `
                    <div class="bg-white p-5 md:p-6 rounded-3xl shadow-card border border-slate-100">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="font-bold text-lg text-slate-800">Data ${sheetName}</h3>
                        </div>
                        <div class="w-full overflow-x-auto rounded-xl border border-slate-100">
                            <table class="w-full text-left text-sm whitespace-nowrap min-w-max">
                                <thead class="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
                                    <tr>${headers.map((h) => `<th class="px-4 py-3">${h}</th>`).join('')}</tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${data.map((r) => `<tr>${headers.map((h) => `<td class="px-4 py-3">${r[h] || '-'}</td>`).join('')}</tr>`).join('')}
                                    ${data.length === 0 ? `<tr><td colspan="10" class="text-center py-6 text-slate-400">Kosong</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `
      hideLoader()
    })
    .catch((e) => {
      showToast('Gagal memuat', 'error')
      hideLoader()
    })
}

function formTambahTugas() {
  const html = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nama Tugas *</label>
                        <input type="text" id="ft_nama" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm font-semibold" placeholder="Contoh: Cetak Banner Utama">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Untuk Seksi (Role) *</label>
                            <select id="ft_role" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white">
                                ${ROLES.map((r) => `<option value="${r}">${r}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">PIC (Penanggung Jawab)</label>
                            <input type="text" id="ft_pic" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white" placeholder="Nama Anggota">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Deadline (Batas Waktu)</label>
                            <input type="date" id="ft_deadline" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-white" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Keterkaitan Agenda</label>
                            <input type="text" id="ft_agenda" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm bg-slate-50" placeholder="Opsional (ID Agenda)">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Catatan Tambahan</label>
                        <input type="text" id="ft_catatan" class="w-full px-4 py-2.5 rounded-xl input-premium text-sm" placeholder="Instruksi spesifik tugas...">
                    </div>
                </div>
            `
  openModal('Tambah Tugas Baru', html, async () => {
    const data = {
      NamaTugas: document.getElementById('ft_nama').value.trim(),
      Role: document.getElementById('ft_role').value,
      PIC: document.getElementById('ft_pic').value.trim(),
      Deadline: document.getElementById('ft_deadline').value,
      ID_Agenda: document.getElementById('ft_agenda').value.trim(),
      Catatan: document.getElementById('ft_catatan').value.trim(),
      Status: 'Belum',
      Bukti: '-',
    }
    if (!data.NamaTugas) return showToast('Nama Tugas wajib diisi', 'error')
    showLoader('Menyimpan tugas baru...')
    try {
      await apiCall('insertRow', { sheetName: 'Tugas', data })
      closeModal()
      showToast('Tugas berhasil ditambahkan', 'success')
      renderTugas(STATE.currentView === 'tugas' ? STATE.user.Role : null)
    } catch (e) {
      showToast('Gagal menyimpan tugas', 'error')
    }
    hideLoader()
  })
}

function bukaDetailTugas(tugasStr) {
  const t = JSON.parse(tugasStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'"))
  const html = `
                <div class="space-y-5">
                    <div class="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100 mb-2">
                        <div class="text-[10px] font-bold text-brand-gold mb-1.5 uppercase tracking-widest bg-brand-gold/10 inline-block px-2 py-1 rounded-md">${t.Role}</div>
                        <h4 class="text-lg md:text-xl font-bold text-slate-800 leading-snug">${t.NamaTugas}</h4>
                        <div class="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs font-medium text-slate-600">
                            <span class="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"><i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i> ${t.PIC || 'Tanpa PIC'}</span>
                            <span class="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"><i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i> ${t.Deadline ? new Date(t.Deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanpa Deadline'}</span>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Update Status Progress</label>
                        <div class="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
                            ${['Belum', 'On Progress', 'Selesai']
                              .map((s) => {
                                const idSafe = s.replace(/\s+/g, '')
                                const isActive = t.Status === s
                                const activeClass = isActive
                                  ? 'bg-white shadow-md text-brand-green border-brand-green/20'
                                  : 'text-slate-500 border-transparent hover:bg-slate-200'
                                return `
                                <button type="button" onclick="pilihStatusTugas('${s}')" id="btn_tugas_status_${idSafe}"
                                    class="flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg border transition-all ${activeClass}">
                                    ${s}
                                </button>
                                `
                              })
                              .join('')}
                        </div>
                        <input type="hidden" id="ud_tugas_status" value="${t.Status}">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Komentar / Catatan Progress</label>
                        <textarea id="ud_tugas_catatan" rows="3" class="w-full px-4 py-3 rounded-xl input-premium text-sm" placeholder="Laporkan kendala atau perkembangan tugas di sini...">${t.Catatan !== '-' ? t.Catatan || '' : ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Link Bukti Pengerjaan (Foto/File)</label>
                        <div class="relative">
                            <i data-lucide="link" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                            <input type="url" id="ud_tugas_bukti" value="${t.Bukti !== '-' ? t.Bukti || '' : ''}" placeholder="https://drive.google.com/..." class="w-full pl-10 pr-4 py-3 rounded-xl input-premium text-sm">
                        </div>
                        ${t.Bukti && t.Bukti !== '-' && t.Bukti.startsWith('http') ? `<a href="${t.Bukti}" target="_blank" class="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-brand-green hover:underline"><i data-lucide="external-link" class="w-3 h-3"></i> Buka Link Bukti Saat Ini</a>` : ''}
                    </div>
                </div>
            `
  openModal('Perbarui Tugas', html, async () => {
    const dataUpdate = {
      Status: document.getElementById('ud_tugas_status').value,
      Catatan: document.getElementById('ud_tugas_catatan').value.trim() || '-',
      Bukti: document.getElementById('ud_tugas_bukti').value.trim() || '-',
    }
    showLoader('Menyimpan pembaruan tugas...')
    try {
      await apiCall('updateRow', {
        sheetName: 'Tugas',
        id: t.ID,
        data: dataUpdate,
      })
      closeModal()
      showToast('Progress tugas berhasil diperbarui', 'success')
      renderTugas(STATE.currentView === 'tugas' ? STATE.user.Role : null)
    } catch (e) {
      showToast('Gagal update tugas', 'error')
    }
    hideLoader()
  })

  window.pilihStatusTugas = function (status) {
    document.getElementById('ud_tugas_status').value = status
    ;['Belum', 'OnProgress', 'Selesai'].forEach((s) => {
      const btn = document.getElementById(`btn_tugas_status_${s}`)
      if (btn) {
        btn.classList.remove(
          'bg-white',
          'shadow-md',
          'text-brand-green',
          'border-brand-green/20',
        )
        btn.classList.add('text-slate-500', 'border-transparent')
      }
    })
    const activeBtn = document.getElementById(
      `btn_tugas_status_${status.replace(/\s+/g, '')}`,
    )
    if (activeBtn) {
      activeBtn.classList.add(
        'bg-white',
        'shadow-md',
        'text-brand-green',
        'border-brand-green/20',
      )
      activeBtn.classList.remove('text-slate-500', 'border-transparent')
    }
  }
}

function openModal(title, body, onSub) {
  document.getElementById('modalTitle').innerText = title
  document.getElementById('modalBody').innerHTML = body
  const btn = document.getElementById('modalSubmitBtn')
  const newBtn = btn.cloneNode(true)
  btn.parentNode.replaceChild(newBtn, btn)
  newBtn.addEventListener('click', onSub)
  document.getElementById('genericModal').classList.remove('hidden-app')
  lucide.createIcons()
}
function closeModal() {
  document.getElementById('genericModal').classList.add('hidden-app')
}
