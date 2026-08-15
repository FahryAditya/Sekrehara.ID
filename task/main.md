# 📋 OSIS Management System - Development Roadmap

**Workspace**: Cassandra  
**Last Updated**: August 15, 2026  
**Status**: Ready for Development

---

## 🚀 Phase 1 — Foundation (Sprint 1-2)

### 1.1 🔐 Authentication & Login

#### 1.1.1 Halaman Login
- **Frontend**
  - [ ] Buat UI halaman login (email/username + password)
  - [ ] Add "Remember me" checkbox
  - [ ] Add "Forgot password?" link
  - [ ] Responsive design (mobile, tablet, desktop)
  - [ ] Form validation (client-side)
  - [ ] Loading state saat submit
  - [ ] Error message display

- **Backend**
  - [ ] Setup Express.js/Node.js server
  - [ ] Create `/api/auth/login` endpoint (POST)
  - [ ] Validate email/username & password
  - [ ] Hash password comparison (bcrypt)
  - [ ] Generate JWT token
  - [ ] Set refresh token di HttpOnly cookie
  - [ ] Return user data + token

- **Database**
  - [ ] Create `users` table (id, email, username, password_hash, created_at, updated_at)
  - [ ] Create `sessions` table (id, user_id, refresh_token, expires_at)
  - [ ] Add unique index di users.email & users.username

- **UI/UX**
  - [ ] Logo di header
  - [ ] Color scheme konsisten dengan brand OSIS
  - [ ] Focus state yang jelas untuk accessibility
  - [ ] Success/error toast notification

---

#### 1.1.2 Register/Invite Anggota
- **Frontend**
  - [ ] Buat halaman register
  - [ ] Form: email, username, password, confirm password
  - [ ] Password strength indicator
  - [ ] Terms & conditions checkbox
  - [ ] Submit button dengan loading state
  - [ ] Success message + redirect ke login

- **Backend**
  - [ ] Create `/api/auth/register` endpoint (POST)
  - [ ] Validate input (email format, password strength)
  - [ ] Check email/username sudah ada
  - [ ] Hash password
  - [ ] Save ke database
  - [ ] Send email verification (optional untuk Phase 1)

- **Database**
  - [ ] Extend `users` table dengan fields: name, is_verified, created_at

- **UI/UX**
  - [ ] Inline validation feedback
  - [ ] Password requirements display
  - [ ] Link ke halaman login

---

#### 1.1.3 Reset Password
- **Frontend**
  - [ ] Buat halaman forgot password (form email)
  - [ ] Halaman reset password (form password baru)
  - [ ] Token validation feedback
  - [ ] Success message

- **Backend**
  - [ ] Create `/api/auth/forgot-password` endpoint (POST)
  - [ ] Generate reset token (valid 1 jam)
  - [ ] Send email dengan reset link
  - [ ] Create `/api/auth/reset-password` endpoint (POST)
  - [ ] Validate token
  - [ ] Update password

- **Database**
  - [ ] Create `password_resets` table (id, user_id, token, expires_at, created_at)

---

#### 1.1.4 Logout
- **Frontend**
  - [ ] Logout button di navbar
  - [ ] Confirm dialog (optional)
  - [ ] Clear local storage/cookies
  - [ ] Redirect ke halaman login

- **Backend**
  - [ ] Create `/api/auth/logout` endpoint (POST)
  - [ ] Invalidate refresh token di database
  - [ ] Clear session

---

#### 1.1.5 Session & Token Management
- **Backend**
  - [ ] Setup JWT (access token: 15 min)
  - [ ] Setup refresh token (7 hari di HttpOnly cookie)
  - [ ] Create `/api/auth/refresh` endpoint (POST)
  - [ ] Middleware auth verification
  - [ ] Token expiration handling

- **Frontend**
  - [ ] Store access token di memory/state
  - [ ] Auto-refresh token sebelum expired
  - [ ] Redirect ke login jika refresh token expired
  - [ ] Add Authorization header di semua API calls

---

### 1.2 👤 User Profile

#### 1.2.1 Halaman Profil
- **Frontend**
  - [ ] Buat halaman profile
  - [ ] Display: avatar, nama, email, username, joined date
  - [ ] Edit profile button
  - [ ] Profile picture upload

- **Backend**
  - [ ] Create `/api/users/profile` endpoint (GET)
  - [ ] Return user data dari token
  - [ ] Create `/api/users/profile` endpoint (PUT)
  - [ ] Update user data

- **Database**
  - [ ] Add fields ke `users`: avatar_url, phone, date_of_birth, address

- **UI/UX**
  - [ ] Avatar preview
  - [ ] Edit mode dengan form
  - [ ] Save/Cancel buttons

---

#### 1.2.2 Ubah Password
- **Frontend**
  - [ ] Form: password lama, password baru, confirm password baru
  - [ ] Password strength indicator
  - [ ] Submit button

- **Backend**
  - [ ] Create `/api/users/change-password` endpoint (POST)
  - [ ] Verify password lama
  - [ ] Hash & save password baru

---

### 1.3 🔑 Role & Permission System

#### 1.3.1 Setup Role Database
- **Database**
  - [ ] Create `roles` table (id, name, description, created_at)
  - [ ] Create `permissions` table (id, name, description, created_at)
  - [ ] Create `role_permissions` junction table
  - [ ] Insert default roles: Super Admin, Admin, Ketua, Bendahara, Sekbid, Anggota
  - [ ] Define permissions per role

- **Sample Permissions**:
  - `manage_users` - Add/edit/delete users
  - `manage_roles` - Assign roles
  - `view_finance` - View keuangan
  - `manage_finance` - Create/edit keuangan
  - `approve_document` - Approve surat/proposal
  - `create_agenda` - Create agenda
  - `view_all_tasks` - View semua tasks
  - etc.

---

#### 1.3.2 Assign Role ke User
- **Frontend**
  - [ ] (Skip untuk Phase 1, akan di User Management)

- **Backend**
  - [ ] Create `/api/users/:id/role` endpoint (PUT)
  - [ ] Only Super Admin/Admin yang bisa assign
  - [ ] Create `user_roles` table (user_id, role_id)
  - [ ] Support multiple roles per user

- **Database**
  - [ ] Create `user_roles` table (id, user_id, role_id, assigned_at)

---

#### 1.3.3 Middleware Permission Check
- **Backend**
  - [ ] Create permission checking middleware
  - [ ] Extract user dari JWT token
  - [ ] Get roles & permissions dari database
  - [ ] Check if user punya permission untuk endpoint
  - [ ] Return 403 jika tidak punya permission

---

### 1.4 🏠 Dashboard (Basic)

#### 1.4.1 Dashboard Layout
- **Frontend**
  - [ ] Buat layout dashboard (sidebar + main content)
  - [ ] Responsive design
  - [ ] Sidebar collapse/expand button
  - [ ] Navbar dengan user profile + logout
  - [ ] Breadcrumb navigation

- **UI/UX**
  - [ ] Logo di sidebar
  - [ ] Menu items: Dashboard, Anggota, Agenda, Tugas, Surat, etc.
  - [ ] Active menu highlight
  - [ ] Icons untuk setiap menu

---

#### 1.4.2 Dashboard Content (Basic Stats)
- **Frontend**
  - [ ] Card: Total Anggota
  - [ ] Card: Tugas Hari Ini
  - [ ] Card: Agenda Minggu Ini
  - [ ] Card: Pengumuman Terbaru
  - [ ] Simple layout, tidak terlalu kompleks

- **Backend**
  - [ ] Create `/api/dashboard/stats` endpoint (GET)
  - [ ] Get total members count
  - [ ] Get today's tasks count
  - [ ] Get this week's agenda count
  - [ ] Get latest announcements

- **Database**
  - [ ] Query optimization dengan proper indexes

- **UI/UX**
  - [ ] Card layout yang konsisten
  - [ ] Icon + number + label
  - [ ] Subtle background color per card

---

#### 1.4.3 Dashboard Responsiveness
- **Frontend**
  - [ ] Mobile: Stack cards vertically
  - [ ] Tablet: 2 column layout
  - [ ] Desktop: 4 column layout
  - [ ] Hide sidebar di mobile (hamburger menu)

---

### 1.5 🗄️ Database Structure (Phase 1)

#### 1.5.1 Core Tables
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  date_of_birth DATE,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission Junction
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- User-Role Junction
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password Resets
CREATE TABLE password_resets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  entity_type VARCHAR(100),
  entity_id VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id, created_at)
);
```

---

## 🚀 Phase 2 — Core Organization (Sprint 3-4)

### 2.1 👥 Member Management

#### 2.1.1 Daftar Anggota
- **Frontend**
  - [ ] Buat tabel anggota dengan kolom: nama, email, kelas, jurusan, jabatan, status
  - [ ] Pagination (10/25/50 per halaman)
  - [ ] Search by nama/email
  - [ ] Filter by kelas
  - [ ] Filter by status (aktif/tidak aktif)
  - [ ] Sort by nama/email/tanggal join
  - [ ] Action buttons: view, edit, deactivate
  - [ ] Bulk action: delete, deactivate

- **Backend**
  - [ ] Create `/api/members` endpoint (GET)
  - [ ] Support query params: page, limit, search, filter_kelas, filter_status, sort
  - [ ] Return paginated results dengan total count
  - [ ] Create `/api/members` endpoint (POST) - Create member
  - [ ] Create `/api/members/:id` endpoint (GET) - Detail member
  - [ ] Create `/api/members/:id` endpoint (PUT) - Update member
  - [ ] Create `/api/members/:id` endpoint (DELETE) - Delete member

- **Database**
  - [ ] Create `members` table
  ```sql
  CREATE TABLE members (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    kelas VARCHAR(50),
    jurusan VARCHAR(100),
    nomor_induk VARCHAR(50) UNIQUE,
    jabatan VARCHAR(100),
    status ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
    join_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (status, kelas)
  );
  ```

- **UI/UX**
  - [ ] Table dengan hover state
  - [ ] Loading skeleton saat fetch data
  - [ ] Empty state message
  - [ ] Confirmation dialog sebelum delete

---

#### 2.1.2 Form Tambah/Edit Anggota
- **Frontend**
  - [ ] Form fields: nama, email, kelas, jurusan, nomor_induk, jabatan, status
  - [ ] Dropdown untuk kelas & jurusan (predefined list)
  - [ ] Profile picture upload
  - [ ] Submit & cancel buttons
  - [ ] Success message setelah submit

- **Backend**
  - [ ] Validate input (required fields, email format)
  - [ ] Check nomor_induk unique
  - [ ] Create user account jika belum ada
  - [ ] Save member data

- **UI/UX**
  - [ ] Form layout yang rapi
  - [ ] Error message inline
  - [ ] Loading state pada submit button

---

#### 2.1.3 Detail Anggota
- **Frontend**
  - [ ] Halaman detail member
  - [ ] Display: foto, nama, email, kelas, jurusan, jabatan, status aktif
  - [ ] Edit & deactivate buttons
  - [ ] Aktivitas/riwayat member (optional untuk Phase 2)

- **Backend**
  - [ ] Get member detail dari `/api/members/:id`

---

#### 2.1.4 Import/Export Member
- **Frontend**
  - [ ] Button "Import Excel"
  - [ ] File upload form
  - [ ] Preview data sebelum import
  - [ ] Validation errors display
  - [ ] Button "Export Excel"
  - [ ] Button "Export PDF"

- **Backend**
  - [ ] Create `/api/members/import` endpoint (POST)
  - [ ] Parse Excel file
  - [ ] Validate data
  - [ ] Bulk insert ke database
  - [ ] Return success/error report
  - [ ] Create `/api/members/export/excel` endpoint (GET)
  - [ ] Generate Excel file dengan member data
  - [ ] Create `/api/members/export/pdf` endpoint (GET)
  - [ ] Generate PDF file

- **Libraries**
  - [ ] `exceljs` atau `xlsx` untuk Excel
  - [ ] `pdfkit` atau `html2pdf` untuk PDF

---

### 2.2 🏛️ Organizational Structure

#### 2.2.1 Manage Sekbid (Section)
- **Frontend**
  - [ ] Halaman struktur organisasi
  - [ ] List sekbid: nama, koordinator, jumlah anggota
  - [ ] Button tambah sekbid
  - [ ] Button edit sekbid
  - [ ] Button delete sekbid

- **Backend**
  - [ ] Create `sekbid` table
  ```sql
  CREATE TABLE sekbid (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `/api/sekbid` endpoint (GET, POST)
  - [ ] Create `/api/sekbid/:id` endpoint (GET, PUT, DELETE)

- **Database**
  - [ ] Add column `sekbid_id` ke `members` table dengan foreign key

- **UI/UX**
  - [ ] Card layout untuk setiap sekbid
  - [ ] Show coordinator name & member count
  - [ ] Edit/delete buttons

---

#### 2.2.2 Assign Member ke Sekbid
- **Frontend**
  - [ ] Saat edit member, ada dropdown untuk pilih sekbid
  - [ ] Multi-select jika member bisa di multiple sekbid

- **Backend**
  - [ ] Update member dengan sekbid_id
  - [ ] Jika multi-sekbid, create junction table `member_sekbid`

---

#### 2.2.3 Jabatan (Position) Management
- **Frontend**
  - [ ] Halaman manage jabatan
  - [ ] List: ketua, wakil ketua, bendahara, sekretaris, dll
  - [ ] Form tambah/edit jabatan

- **Backend**
  - [ ] Create `positions` table
  ```sql
  CREATE TABLE positions (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    level INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `/api/positions` endpoint (GET, POST, PUT, DELETE)

- **Database**
  - [ ] Add column `position_id` ke junction table `member_positions`

---

#### 2.2.4 Struktur Visual
- **Frontend**
  - [ ] Halaman struktur organisasi dengan visual hierarchy
  - [ ] Display: Ketua → Wakil → Bendahara → Sekretaris → Sekbid heads
  - [ ] Card dengan foto member & jabatan
  - [ ] Responsive untuk mobile

- **UI/UX**
  - [ ] Tree/chart layout
  - [ ] Photo thumbnail + name + position
  - [ ] Color coded per level/sekbid

---

### 2.3 📅 Agenda & Calendar

#### 2.3.1 Create Agenda
- **Frontend**
  - [ ] Form: nama agenda, tanggal, waktu mulai, waktu selesai, lokasi, deskripsi
  - [ ] Datepicker & timepicker
  - [ ] Select peserta (multi-select members)
  - [ ] Status: draft, published, selesai, batal
  - [ ] Submit button

- **Backend**
  - [ ] Create `/api/agenda` endpoint (POST)
  - [ ] Create `agenda` table
  ```sql
  CREATE TABLE agenda (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255),
    created_by UUID REFERENCES users(id),
    status ENUM('draft', 'published', 'selesai', 'batal') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Validate date/time (start < end)
  - [ ] Validate peserta exist

- **Database**
  - [ ] Create `agenda_participants` junction table
  ```sql
  CREATE TABLE agenda_participants (
    id UUID PRIMARY KEY,
    agenda_id UUID REFERENCES agenda(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id),
    rsvp_status ENUM('pending', 'akan_hadir', 'tidak_hadir') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- **UI/UX**
  - [ ] Form layout yang user-friendly
  - [ ] Date picker dengan calendar
  - [ ] Time picker dengan dropdown jam/menit
  - [ ] Multi-select untuk peserta dengan search

---

#### 2.3.2 Calendar View
- **Frontend**
  - [ ] Implementasi calendar widget (bisa pakai react-big-calendar)
  - [ ] Show agenda sebagai event di calendar
  - [ ] Month/week/day view
  - [ ] Click agenda → show detail
  - [ ] Drag event untuk reschedule (optional untuk Phase 2)

- **Backend**
  - [ ] Create `/api/agenda/calendar` endpoint (GET)
  - [ ] Query param: month, year
  - [ ] Return agenda list untuk bulan tersebut

- **Libraries**
  - [ ] `react-big-calendar` atau `fullcalendar`

---

#### 2.3.3 List & Filter Agenda
- **Frontend**
  - [ ] Halaman list agenda (table view)
  - [ ] Kolom: tanggal, nama agenda, lokasi, peserta count, status
  - [ ] Filter by status
  - [ ] Filter by tanggal range
  - [ ] Search by nama agenda
  - [ ] Sort by tanggal

- **Backend**
  - [ ] Create `/api/agenda` endpoint (GET)
  - [ ] Support query: page, limit, status, date_from, date_to, search, sort

---

#### 2.3.4 Edit & Delete Agenda
- **Frontend**
  - [ ] Button edit di halaman agenda
  - [ ] Pre-fill form dengan data existing
  - [ ] Button delete dengan confirmation dialog

- **Backend**
  - [ ] Create `/api/agenda/:id` endpoint (PUT, DELETE)
  - [ ] Only created_by atau admin yang bisa edit/delete

---

---

## 🚀 Phase 3 — Activity Management (Sprint 5-6)

### 3.1 📝 Meeting Management

#### 3.1.1 Buat Rapat
- **Frontend**
  - [ ] Form: nama rapat, tanggal, waktu, lokasi, peserta
  - [ ] Assign PIC (Penanggung Jawab)
  - [ ] Status: draft, terjadwal, berlangsung, selesai
  - [ ] Submit button

- **Backend**
  - [ ] Create `meetings` table
  ```sql
  CREATE TABLE meetings (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    pic_id UUID REFERENCES members(id),
    created_by UUID REFERENCES users(id),
    status ENUM('draft', 'terjadwal', 'berlangsung', 'selesai') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `/api/meetings` endpoint (POST)
  - [ ] Create `meeting_participants` junction table

---

#### 3.1.2 Absensi Rapat
- **Frontend**
  - [ ] Halaman absensi dengan list peserta
  - [ ] Checkbox untuk mark hadir/tidak hadir
  - [ ] Input keterangan (izin/sakit)
  - [ ] Save button

- **Backend**
  - [ ] Create `meeting_attendance` table
  ```sql
  CREATE TABLE meeting_attendance (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id),
    member_id UUID REFERENCES members(id),
    status ENUM('hadir', 'izin', 'sakit', 'alpha') DEFAULT 'alpha',
    keterangan TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `/api/meetings/:id/attendance` endpoint (POST, PUT)

---

#### 3.1.3 Notulen (Minutes)
- **Frontend**
  - [ ] Form pembahasan (text editor)
  - [ ] Tambahkan pembahasan baru button
  - [ ] Form keputusan
  - [ ] Tambahkan keputusan baru button
  - [ ] Field untuk tindak lanjut (action items)
  - [ ] Submit & publish button

- **Backend**
  - [ ] Create `meeting_notes` table
  ```sql
  CREATE TABLE meeting_notes (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id),
    content TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `meeting_decisions` table
  ```sql
  CREATE TABLE meeting_decisions (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id),
    decision TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `/api/meetings/:id/notes` endpoint (POST, PUT)
  - [ ] Create `/api/meetings/:id/decisions` endpoint (POST)

---

#### 3.1.4 Action Items (Tindak Lanjut)
- **Frontend**
  - [ ] Create form untuk action item
  - [ ] Field: deskripsi, assigned to, deadline, priority
  - [ ] Button save

- **Backend**
  - [ ] Create `meeting_action_items` table
  ```sql
  CREATE TABLE meeting_action_items (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id),
    description TEXT,
    assigned_to UUID REFERENCES members(id),
    deadline DATE,
    priority ENUM('low', 'medium', 'high'),
    status ENUM('open', 'in_progress', 'done') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

---

#### 3.1.5 Export Notulen PDF
- **Frontend**
  - [ ] Button "Export PDF" di halaman meeting detail
  - [ ] Download automatically

- **Backend**
  - [ ] Create `/api/meetings/:id/export-pdf` endpoint (GET)
  - [ ] Generate PDF dengan format: judul, tanggal, peserta, pembahasan, keputusan, action items

---

### 3.2 ✅ Task Management

#### 3.2.1 Create Task
- **Frontend**
  - [ ] Form: judul, deskripsi, assign to, deadline, priority
  - [ ] Priority dropdown: low, medium, high, critical
  - [ ] Date picker untuk deadline
  - [ ] Multi-select untuk assign ke multiple member (optional)
  - [ ] Status: todo (default)
  - [ ] Submit button

- **Backend**
  - [ ] Create `tasks` table
  ```sql
  CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in_progress', 'review', 'done', 'cancelled') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    deadline DATE,
    assigned_to UUID REFERENCES members(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (status, priority, deadline)
  );
  ```
  - [ ] Create `/api/tasks` endpoint (POST)

- **UI/UX**
  - [ ] Form layout yang clean
  - [ ] Priority indicator dengan warna (red=critical, orange=high, yellow=medium, green=low)
  - [ ] Deadline display dengan warning jika sudah lewat

---

#### 3.2.2 Task List & Filter
- **Frontend**
  - [ ] Halaman task list
  - [ ] Kolom: judul, assigned to, deadline, priority, status
  - [ ] Filter by status
  - [ ] Filter by priority
  - [ ] Filter by assigned member
  - [ ] Search by judul
  - [ ] Sort by deadline, priority, created_at

- **Backend**
  - [ ] Create `/api/tasks` endpoint (GET)
  - [ ] Support query: page, limit, status, priority, assigned_to, search, sort

---

#### 3.2.3 Kanban Board
- **Frontend**
  - [ ] Kanban board dengan 5 kolom: Todo, In Progress, Review, Done, Cancelled
  - [ ] Drag & drop task antar kolom
  - [ ] Click task → show detail
  - [ ] Add new task button di setiap kolom
  - [ ] Count badge di setiap kolom

- **Backend**
  - [ ] Update status saat drag & drop
  - [ ] Create `/api/tasks/:id/status` endpoint (PUT)
  - [ ] Support bulk update status

- **Libraries**
  - [ ] `react-beautiful-dnd` atau `dnd-kit` untuk drag & drop
  - [ ] Atau `TanStack Query` untuk state management

---

#### 3.2.4 Task Detail & Comments
- **Frontend**
  - [ ] Modal/page untuk task detail
  - [ ] Show: judul, deskripsi, assigned to, deadline, priority, status
  - [ ] Edit & delete buttons (hanya untuk creator/assigned)
  - [ ] Comment section
  - [ ] Comment form dengan text area
  - [ ] Display comments dengan user & timestamp
  - [ ] Edit/delete own comment

- **Backend**
  - [ ] Create `task_comments` table
  ```sql
  CREATE TABLE task_comments (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `/api/tasks/:id/comments` endpoint (POST, GET)
  - [ ] Create `/api/tasks/:id/comments/:comment_id` endpoint (PUT, DELETE)

- **UI/UX**
  - [ ] Comment display dengan avatar
  - [ ] Timestamp relative (e.g., "2 hours ago")
  - [ ] Edit/delete button di comment hover

---

#### 3.2.5 Task Attachment
- **Frontend**
  - [ ] Upload file button di task detail
  - [ ] Show uploaded files list
  - [ ] Delete file button
  - [ ] File preview link

- **Backend**
  - [ ] Create `task_attachments` table
  ```sql
  CREATE TABLE task_attachments (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Setup file storage (AWS S3 atau local storage)
  - [ ] Create `/api/tasks/:id/attachments` endpoint (POST, GET)
  - [ ] Create `/api/tasks/:id/attachments/:attachment_id` endpoint (DELETE)

---

#### 3.2.6 Edit & Delete Task
- **Frontend**
  - [ ] Edit form (pre-fill current data)
  - [ ] Delete button dengan confirmation dialog

- **Backend**
  - [ ] Create `/api/tasks/:id` endpoint (PUT, DELETE)
  - [ ] Only creator atau assigned member yang bisa edit

---

#### 3.2.7 Task Reminder/Notification
- **Frontend**
  - [ ] Show overdue indicator (red color)
  - [ ] Show "Due in X days" label

- **Backend**
  - [ ] Create job untuk send reminder notifications (Bulljs/node-cron)
  - [ ] Check tasks yang deadline besok/sudah overdue
  - [ ] Create notification record
  - [ ] Send notification ke assigned member

---

### 3.3 🔔 Notification System (Basic)

#### 3.3.1 Notification Database
- **Database**
  - [ ] Create `notifications` table
  ```sql
  CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    related_entity_type VARCHAR(100),
    related_entity_id VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id, is_read, created_at)
  );
  ```

---

#### 3.3.2 Notification Center
- **Frontend**
  - [ ] Bell icon di navbar
  - [ ] Badge dengan unread count
  - [ ] Dropdown notification list (max 10 latest)
  - [ ] Click notification → navigate ke related entity
  - [ ] Mark as read button
  - [ ] "View all notifications" link → full page

- **Backend**
  - [ ] Create `/api/notifications` endpoint (GET)
  - [ ] Support query: limit, page, unread_only
  - [ ] Create `/api/notifications/:id/read` endpoint (PUT)
  - [ ] Create `/api/notifications/mark-all-read` endpoint (PUT)

---

---

## 🚀 Phase 4 — Administration (Sprint 7-8)

### 4.1 📄 Letter Management

#### 4.1.1 Create Letter
- **Frontend**
  - [ ] Form: tipe surat (masuk/keluar), nomor surat, tanggal, perihal, pengirim/penerima
  - [ ] File upload (PDF/image)
  - [ ] Status: draft, review, approved, rejected, archived
  - [ ] Submit button

- **Backend**
  - [ ] Create `letters` table
  ```sql
  CREATE TABLE letters (
    id UUID PRIMARY KEY,
    letter_type ENUM('masuk', 'keluar') NOT NULL,
    letter_number VARCHAR(100) UNIQUE,
    date DATE NOT NULL,
    subject VARCHAR(500),
    sender VARCHAR(255),
    recipient VARCHAR(255),
    file_url VARCHAR(500),
    status ENUM('draft', 'review', 'approved', 'rejected', 'archived') DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `/api/letters` endpoint (POST, GET)

---

#### 4.1.2 Letter Number Generation
- **Backend**
  - [ ] Auto-generate nomor surat format: [TYPE]/OSIS/[MONTH]/[YEAR]
  - [ ] Contoh: 001/OSIS/08/2026
  - [ ] Create function untuk generate based on format

---

#### 4.1.3 Letter Approval
- **Frontend**
  - [ ] Halaman pending letters (status review)
  - [ ] Show letter preview
  - [ ] Approve & reject buttons
  - [ ] Comment field untuk rejection

- **Backend**
  - [ ] Create `/api/letters/:id/approve` endpoint (POST)
  - [ ] Create `/api/letters/:id/reject` endpoint (POST)
  - [ ] Update status, recorded_by, recorded_at

---

#### 4.1.4 Search & Archive Letters
- **Frontend**
  - [ ] List halaman dengan filter: tipe, status, tanggal range
  - [ ] Search by nomor surat / subject / pengirim
  - [ ] Button archive
  - [ ] Show archived letters in separate tab/filter

- **Backend**
  - [ ] Create `/api/letters` GET dengan query support
  - [ ] Create `/api/letters/:id/archive` endpoint (PUT)

---

### 4.2 📁 Digital Archive

#### 4.2.1 Folder & File Upload
- **Frontend**
  - [ ] Folder structure view (tree/breadcrumb)
  - [ ] Upload file button
  - [ ] Create folder button
  - [ ] List files dengan icon based on type (PDF, Word, Excel, etc)
  - [ ] Download file button
  - [ ] Delete file button
  - [ ] Rename file/folder

- **Backend**
  - [ ] Create `folders` table
  ```sql
  CREATE TABLE folders (
    id UUID PRIMARY KEY,
    parent_id UUID REFERENCES folders(id),
    name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, name)
  );
  ```
  - [ ] Create `files` table
  ```sql
  CREATE TABLE files (
    id UUID PRIMARY KEY,
    folder_id UUID REFERENCES folders(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INT,
    file_type VARCHAR(50),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `/api/folders` endpoint (POST, GET)
  - [ ] Create `/api/files` endpoint (POST, GET)
  - [ ] Create `/api/files/:id/download` endpoint (GET)

---

#### 4.2.2 File Preview
- **Frontend**
  - [ ] PDF preview
  - [ ] Image preview
  - [ ] Text file preview

- **Libraries**
  - [ ] `react-pdf` untuk PDF preview
  - [ ] `react-image-lightbox` untuk image

---

#### 4.2.3 File Permissions
- **Frontend**
  - [ ] Share file/folder button
  - [ ] Permission modal: private, shared with group, public
  - [ ] Add members untuk shared folder

- **Backend**
  - [ ] Create `file_permissions` table
  ```sql
  CREATE TABLE file_permissions (
    id UUID PRIMARY KEY,
    file_id UUID REFERENCES files(id),
    user_id UUID REFERENCES users(id),
    sekbid_id UUID REFERENCES sekbid(id),
    permission_type ENUM('view', 'edit', 'delete') DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Check permission saat access file

---

### 4.3 📋 Program Kerja (Work Program)

#### 4.3.1 Create Program Kerja
- **Frontend**
  - [ ] Form: nama proker, sekbid, PIC, tanggal mulai, tanggal selesai, deskripsi
  - [ ] Target field (text)
  - [ ] Status: planning, in_progress, completed, cancelled
  - [ ] Submit button

- **Backend**
  - [ ] Create `work_programs` table
  ```sql
  CREATE TABLE work_programs (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sekbid_id UUID REFERENCES sekbid(id),
    pic_id UUID REFERENCES members(id),
    start_date DATE,
    end_date DATE,
    target TEXT,
    status ENUM('planning', 'in_progress', 'completed', 'cancelled') DEFAULT 'planning',
    progress_percentage INT DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `/api/work-programs` endpoint (POST, GET)

---

#### 4.3.2 Program Progress Tracking
- **Frontend**
  - [ ] Progress bar di list & detail
  - [ ] Update progress button
  - [ ] Input progress percentage
  - [ ] Add activity/update log

- **Backend**
  - [ ] Create `work_program_updates` table untuk track changes
  - [ ] Create `/api/work-programs/:id/progress` endpoint (PUT)

---

#### 4.3.3 Link Tasks to Work Program
- **Frontend**
  - [ ] Add tasks section di work program detail
  - [ ] Link existing task atau create new task
  - [ ] Show task status & completion count

- **Backend**
  - [ ] Add `work_program_id` column ke `tasks` table
  - [ ] Create junction table `work_program_tasks`

---

#### 4.3.4 Work Program Report
- **Frontend**
  - [ ] Report view per work program
  - [ ] Show: progress, timeline, tasks, budget (if applicable)
  - [ ] Export PDF button

- **Backend**
  - [ ] Generate report dengan summary data

---

---

## 🚀 Phase 5 — Finance & Attendance (Sprint 9-10)

### 5.1 💰 Finance Management

#### 5.1.1 Transaction Entry
- **Frontend**
  - [ ] Form: tipe (masuk/keluar), jumlah, kategori, tanggal, deskripsi, bukti
  - [ ] File upload untuk bukti transaksi
  - [ ] Kategori dropdown
  - [ ] Submit button

- **Backend**
  - [ ] Create `transactions` table
  ```sql
  CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    type ENUM('masuk', 'keluar') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category VARCHAR(100),
    date DATE NOT NULL,
    description TEXT,
    receipt_url VARCHAR(500),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (date, type)
  );
  ```
  - [ ] Create `transaction_categories` table
  - [ ] Create `/api/transactions` endpoint (POST, GET)

---

#### 5.1.2 Balance Calculation
- **Backend**
  - [ ] Auto-calculate balance: SUM(masuk) - SUM(keluar)
  - [ ] Create `organization_balance` table untuk cache
  - [ ] Update balance setiap kali ada transaction baru

---

#### 5.1.3 Transaction Report
- **Frontend**
  - [ ] Report halaman dengan table: tanggal, jenis, kategori, jumlah, saldo
  - [ ] Filter by tanggal, kategori
  - [ ] Calculate total masuk, keluar, saldo
  - [ ] Export Excel button
  - [ ] Export PDF button

- **Backend**
  - [ ] Create `/api/transactions/report` endpoint (GET)
  - [ ] Support query: date_from, date_to, category
  - [ ] Calculate summary

---

### 5.2 📝 Attendance System

#### 5.2.1 Create Attendance Session
- **Frontend**
  - [ ] Form untuk create attendance session
  - [ ] Link ke agenda/kegiatan
  - [ ] Generate QR Code button
  - [ ] Copy link button (untuk share)

- **Backend**
  - [ ] Create `attendance_sessions` table
  ```sql
  CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    agenda_id UUID REFERENCES agenda(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
  );
  ```
  - [ ] Generate QR code dengan session ID
  - [ ] Create `/api/attendance/sessions` endpoint (POST)

---

#### 5.2.2 QR Code Scan
- **Frontend**
  - [ ] QR Scanner page (use webcam)
  - [ ] Input field untuk manual entry (jika QR rusak)
  - [ ] Display: nama, waktu, status
  - [ ] Auto-capture saat berhasil scan

- **Backend**
  - [ ] Create `attendance_records` table
  ```sql
  CREATE TABLE attendance_records (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES attendance_sessions(id),
    member_id UUID REFERENCES members(id),
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('hadir', 'izin', 'sakit', 'alpha') DEFAULT 'hadir'
  );
  ```
  - [ ] Create `/api/attendance/scan` endpoint (POST)
  - [ ] Validate session still active
  - [ ] Prevent duplicate scan (same member dalam 1 session)

- **Libraries**
  - [ ] `qr-scanner` atau `jsqr` untuk scan QR

---

#### 5.2.3 Attendance Report
- **Frontend**
  - [ ] Report view per kegiatan/agenda
  - [ ] Table: member name, status, waktu scan
  - [ ] Summary: total hadir, izin, sakit, alpha
  - [ ] Export Excel button

- **Backend**
  - [ ] Create `/api/attendance/report` endpoint (GET)
  - [ ] Query: session_id atau agenda_id
  - [ ] Calculate summary

---

---

## 🚀 Phase 6 — Communication (Sprint 11-12)

### 6.1 📢 Announcement

#### 6.1.1 Create Announcement
- **Frontend**
  - [ ] Form: judul, konten (text editor), attachment, target audience
  - [ ] Target: specific members, specific sekbid, all members
  - [ ] Schedule publish date (optional)
  - [ ] Pin checkbox
  - [ ] Submit button

- **Backend**
  - [ ] Create `announcements` table
  ```sql
  CREATE TABLE announcements (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_by UUID REFERENCES users(id),
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP,
    scheduled_for TIMESTAMP,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  - [ ] Create `announcement_recipients` table (untuk track target audience)
  - [ ] Create `/api/announcements` endpoint (POST, GET)

---

#### 6.1.2 Announcement Scheduling
- **Backend**
  - [ ] Setup cron job atau scheduler untuk publish scheduled announcements
  - [ ] Check announcement dengan scheduled_for <= now
  - [ ] Update status ke published
  - [ ] Send notification

---

#### 6.1.3 Announcement List & Pin
- **Frontend**
  - [ ] List announcements (pinned di atas)
  - [ ] Edit & delete buttons
  - [ ] Pin/unpin button
  - [ ] Show published date

- **Backend**
  - [ ] Create `/api/announcements/:id/pin` endpoint (PUT)
  - [ ] Create `/api/announcements/:id` endpoint (PUT, DELETE)

---

### 6.2 🔔 Notification Service (Advanced)

#### 6.2.1 In-App Notifications
- [ ] Implement notification broadcasting (WebSocket atau polling)
- [ ] Real-time notification display
- [ ] Sound notification (optional)

#### 6.2.2 Email Notifications (Optional Phase 6)
- [ ] Setup email service (SendGrid, Mailtrap, etc)
- [ ] Email template untuk: task assignment, deadline reminder, announcement, approval
- [ ] User preference untuk enable/disable email notification

#### 6.2.3 WhatsApp/SMS Notifications (Optional Phase 6)
- [ ] Setup WhatsApp Business API atau SMS service
- [ ] Send reminder 1 hari sebelum deadline

---

---

## 🚀 Phase 7 — Advanced Features (Sprint 13+)

### 7.1 🔎 Global Search

#### 7.1.1 Unified Search
- **Frontend**
  - [ ] Search input di navbar
  - [ ] Search across: members, letters, agenda, meetings, tasks, documents, proker, transactions, announcements
  - [ ] Show results in grouped categories
  - [ ] Click result → navigate to detail

- **Backend**
  - [ ] Create `/api/search` endpoint (GET)
  - [ ] Query param: q (search term)
  - [ ] Search multiple tables dengan LIKE
  - [ ] Combine results dengan type
  - [ ] Limit per type (max 5 results per category)

---

### 7.2 🕵️ Activity Log

#### 7.2.1 Log Activities
- **Backend**
  - [ ] Create `activity_logs` table (sudah ada di Phase 1)
  - [ ] Log untuk: create, update, delete, approve, reject, download
  - [ ] Record: user, action, entity_type, entity_id, timestamp, details
  - [ ] Middleware untuk auto-log setiap POST/PUT/DELETE request

---

#### 7.2.2 Activity Log Viewer
- **Frontend**
  - [ ] Admin halaman untuk view activity logs
  - [ ] Filter by user, action, entity type, date range
  - [ ] Show detailed information per activity
  - [ ] Pagination

- **Backend**
  - [ ] Create `/api/activity-logs` endpoint (GET)
  - [ ] Support query: user_id, action, entity_type, date_from, date_to

---

### 7.3 📸 Activity Documentation

#### 7.3.1 Photo/Video Gallery
- **Frontend**
  - [ ] Create album untuk kegiatan
  - [ ] Upload foto/video
  - [ ] Gallery view (grid/carousel)
  - [ ] Link ke agenda/kegiatan

- **Backend**
  - [ ] Create `media_albums` table
  - [ ] Create `media_items` table
  - [ ] Create `/api/media/albums` endpoint (POST, GET)
  - [ ] Create `/api/media/items` endpoint (POST, GET)

---

### 7.4 📊 Advanced Analytics & Reports

#### 7.4.1 Organization Dashboard
- **Frontend**
  - [ ] Statistik: total members, member per sekbid, joined this month
  - [ ] Chart: member by kelas/jurusan
  - [ ] Finance chart: revenue vs expense, balance trend
  - [ ] Task completion rate
  - [ ] Attendance rate per member

- **Backend**
  - [ ] Create `/api/analytics/organization` endpoint (GET)
  - [ ] Calculate statistics & aggregates

---

### 7.5 💾 Backup & Export

#### 7.5.1 Database Backup
- **Backend**
  - [ ] Implement automated database backup (daily/weekly)
  - [ ] Store backups securely
  - [ ] Create `/api/admin/backup` endpoint (GET) - trigger backup
  - [ ] Create `/api/admin/backups` endpoint (GET) - list backups

---

#### 7.5.2 Data Export
- [ ] Export all data ke CSV/Excel (per module)
- [ ] Create `/api/admin/export` endpoint dengan parameter untuk modul

---

---

## 🗄️ Database Summary

### Core Tables
```
users
├── roles
│   └── permissions
├── sessions
├── password_resets
└── activity_logs

members
├── sekbid
├── positions
└── member_sekbid (junction)

agenda
└── agenda_participants

meetings
├── meeting_participants
├── meeting_attendance
├── meeting_notes
├── meeting_decisions
└── meeting_action_items

tasks
├── task_comments
└── task_attachments

letters
transactions
transaction_categories

folders
└── files
    └── file_permissions

work_programs
└── work_program_updates

announcements
└── announcement_recipients

notifications

attendance_sessions
└── attendance_records

media_albums
└── media_items
```

---

## 🔗 API Endpoints Summary

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Users
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `POST /api/users/change-password`

### Members
- `GET /api/members`
- `POST /api/members`
- `GET /api/members/:id`
- `PUT /api/members/:id`
- `DELETE /api/members/:id`
- `POST /api/members/import`
- `GET /api/members/export/excel`
- `GET /api/members/export/pdf`

### Sekbid
- `GET /api/sekbid`
- `POST /api/sekbid`
- `GET /api/sekbid/:id`
- `PUT /api/sekbid/:id`
- `DELETE /api/sekbid/:id`

### Agenda
- `GET /api/agenda`
- `POST /api/agenda`
- `GET /api/agenda/:id`
- `PUT /api/agenda/:id`
- `DELETE /api/agenda/:id`
- `GET /api/agenda/calendar`

### Meetings
- `GET /api/meetings`
- `POST /api/meetings`
- `GET /api/meetings/:id`
- `PUT /api/meetings/:id`
- `POST /api/meetings/:id/attendance`
- `POST /api/meetings/:id/notes`
- `POST /api/meetings/:id/decisions`
- `GET /api/meetings/:id/export-pdf`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PUT /api/tasks/:id/status`
- `GET /api/tasks/:id/comments`
- `POST /api/tasks/:id/comments`
- `PUT /api/tasks/:id/comments/:comment_id`
- `DELETE /api/tasks/:id/comments/:comment_id`
- `POST /api/tasks/:id/attachments`
- `GET /api/tasks/:id/attachments`
- `DELETE /api/tasks/:id/attachments/:attachment_id`

### Letters
- `GET /api/letters`
- `POST /api/letters`
- `GET /api/letters/:id`
- `PUT /api/letters/:id`
- `DELETE /api/letters/:id`
- `POST /api/letters/:id/approve`
- `POST /api/letters/:id/reject`
- `PUT /api/letters/:id/archive`

### Files/Archive
- `GET /api/folders`
- `POST /api/folders`
- `GET /api/files`
- `POST /api/files`
- `GET /api/files/:id/download`
- `DELETE /api/files/:id`

### Work Programs
- `GET /api/work-programs`
- `POST /api/work-programs`
- `GET /api/work-programs/:id`
- `PUT /api/work-programs/:id`
- `PUT /api/work-programs/:id/progress`

### Transactions
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/report`

### Attendance
- `POST /api/attendance/sessions`
- `POST /api/attendance/scan`
- `GET /api/attendance/report`

### Announcements
- `GET /api/announcements`
- `POST /api/announcements`
- `GET /api/announcements/:id`
- `PUT /api/announcements/:id`
- `DELETE /api/announcements/:id`
- `PUT /api/announcements/:id/pin`

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/mark-all-read`

### Dashboard
- `GET /api/dashboard/stats`

### Search
- `GET /api/search`

### Activity Log
- `GET /api/activity-logs`

### Analytics
- `GET /api/analytics/organization`

---

## 🛠️ Tech Stack Recommendations

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma atau TypeORM
- **Auth**: JWT + bcrypt
- **File Upload**: Multer + AWS S3 atau local storage
- **Email**: Nodemailer atau SendGrid
- **Scheduler**: Bull (BullMQ) atau node-cron

### Frontend
- **Framework**: React 18+
- **UI Library**: Tailwind CSS atau Material UI
- **State Management**: TanStack Query (React Query) atau Redux
- **Form**: React Hook Form
- **Calendar**: react-big-calendar atau fullcalendar
- **Drag & Drop**: react-beautiful-dnd atau dnd-kit
- **PDF**: pdfkit (backend) atau react-pdf (viewer)
- **QR Code**: qr-scanner atau jsqr (scanner), qrcode (generator)
- **Rich Text Editor**: TipTap atau Slate
- **Data Table**: TanStack Table (React Table)

### DevOps
- **Version Control**: GitHub
- **CI/CD**: GitHub Actions
- **Server**: AWS EC2 / DigitalOcean / Railway
- **Deployment**: Docker
- **Monitoring**: Sentry

---

## 📅 Timeline Estimate

- **Phase 1**: 2-3 minggu (Foundation)
- **Phase 2**: 2-3 minggu (Core Organization)
- **Phase 3**: 3-4 minggu (Activity Management)
- **Phase 4**: 2-3 minggu (Administration)
- **Phase 5**: 2-3 minggu (Finance & Attendance)
- **Phase 6**: 1-2 minggu (Communication)
- **Phase 7**: 2-3 minggu+ (Advanced)

**Total**: ~15-21 minggu (3.5-5 bulan) untuk production-ready system

---

## ✅ Definition of Done

Setiap task/feature dianggap **DONE** jika:
1. ✅ Code written & tested
2. ✅ Backend API endpoint siap
3. ✅ Frontend UI implemented
4. ✅ Database migration & seed data
5. ✅ Error handling & validation
6. ✅ Unit tests (coverage >80%)
7. ✅ Integration tests
8. ✅ Code review approved
9. ✅ Documentation updated
10. ✅ Deployed ke staging environment
11. ✅ QA testing passed
12. ✅ Ready for production deployment

---

**Maintained by**: Development Team  
**Last Review**: August 15, 2026  
**Status**: 🟢 Ready for Development
