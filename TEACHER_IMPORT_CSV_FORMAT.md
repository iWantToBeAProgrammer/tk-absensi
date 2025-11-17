# Teacher Import CSV Format

## Overview
The teacher import now creates both:
1. **Supabase Auth Account** - For login credentials
2. **Teacher Database Record** - For system data
3. **User Database Record** - For role management

## Required CSV Columns

| Column | Type | Required | Example | Notes |
|--------|------|----------|---------|-------|
| name | String | ✅ Yes | Budi Santoso | Full name of teacher |
| phone | String | ✅ Yes | 08123456789 | Unique phone number |
| email | String | ✅ Yes | budi@example.com | **NEW** - Used for login & auth |
| dateOfBirth | Date | ✅ Yes | 1985-05-15 | Format: YYYY-MM-DD |
| password | String | ❌ Optional | MyPass123! | If not provided, system generates secure password |

## CSV Template

```csv
name,phone,email,dateOfBirth,password
Budi Santoso,08123456789,budi.santoso@school.id,1985-05-15,
Siti Nurhaliza,08234567890,siti.nurhaliza@school.id,1988-03-22,InitialPass123!
Ahmad Wijaya,08345678901,ahmad.wijaya@school.id,1990-07-10,
```

## Important Notes

### Email (NEW!)
- **Required** for authentication account creation
- Must be unique in the system
- Must be valid email format (xxx@domain.com)
- Will be used as the login username

### Password
- **Optional** - If left blank, system generates a secure 12-character password
- If provided, must be at least 8 characters
- Generated passwords include uppercase, lowercase, numbers, and symbols
- **Security Tip**: Provide passwords in a separate secure communication channel

### Date of Birth
- Format: **YYYY-MM-DD** (e.g., 1985-05-15)
- Teacher age must be between 21-65 years old
- Invalid dates will cause import to fail for that row

### Phone Number
- Must be unique per teacher
- Used for contact information
- Can include country code or just local number

## What Gets Created

When a teacher is successfully imported, the system creates:

### 1. Supabase Auth Account
- Email/Password login credentials
- Auto-confirmed email (no verification needed)
- Role set to "TEACHER" in metadata

### 2. Teacher Record (Database)
- Name, phone number, date of birth
- Linked to Supabase auth user via `userId`
- Can be assigned to classes

### 3. User Record (Database)
- User ID (from Supabase)
- Email, name, role (TEACHER)
- Used for authentication and authorization

## Import Response

The system returns import results with:

```json
{
  "message": "Import selesai: 2 berhasil, 1 gagal",
  "summary": {
    "success": 2,
    "errors": ["Baris 4: Email guru@example.com sudah terdaftar"],
    "details": [
      {
        "row": 2,
        "name": "Budi Santoso",
        "email": "budi.santoso@school.id",
        "status": "SUCCESS",
        "message": "Guru dan akun berhasil dibuat",
        "password": "Generated"
      },
      {
        "row": 3,
        "name": "Siti Nurhaliza",
        "email": "siti.nurhaliza@school.id",
        "status": "SUCCESS",
        "message": "Guru dan akun berhasil dibuat",
        "password": "Provided"
      }
    ]
  }
}
```

## Error Handling

Common import errors and reasons:

| Error | Reason | Solution |
|-------|--------|----------|
| Nama wajib diisi | Empty name field | Ensure name is provided |
| Email wajib diisi | Email column missing or empty | Add email column and fill |
| Format email tidak valid | Invalid email format | Use format: name@domain.com |
| Email sudah terdaftar | Email already exists in system | Use unique email |
| Nomor telepon sudah digunakan | Duplicate phone number | Use unique phone numbers |
| Usia guru harus antara 21-65 tahun | Teacher age out of range | Check date of birth |
| Format tanggal lahir tidak valid | Invalid date format | Use YYYY-MM-DD format |
| Gagal membuat akun auth | Supabase auth creation failed | Check email/password requirements |

## How Teachers Can Log In

After successful import, teachers can log in using:
- **Email**: The email provided in the CSV
- **Password**: The password provided OR the generated one (shared by admin)

## Security Best Practices

1. **For Generated Passwords**:
   - Share securely (not via email/chat)
   - Teachers should change password on first login
   - Notify teachers of their temporary credentials separately

2. **For Provided Passwords**:
   - Ensure strong passwords (8+ chars, mixed case, numbers, symbols)
   - Don't include in CSV if sending via email

3. **CSV File**:
   - Delete file after successful import
   - Don't store passwords in CSV files
   - Keep email list confidential

## Example Workflow

1. **Prepare CSV** with teacher data (passwords optional)
2. **Upload** CSV file via admin panel
3. **Review** import results for errors
4. **Share** login credentials with teachers separately
5. **Teachers log in** using email and password
6. **Optional**: Teachers change password on first login
