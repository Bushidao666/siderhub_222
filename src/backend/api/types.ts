import type { AuthService } from '../services/auth/AuthService'
import type { TokenService } from '../services/auth/TokenService'
import type { UploadService } from '../services/upload/UploadService'
import type { HidraService } from '../services/hidra/HidraService'
import type { AcademyService } from '../services/academy/AcademyService'
import type { CybervaultService } from '../services/cybervault/CybervaultService'
import type { AdminService } from '../services/admin/AdminService'
import type { HubService } from '../services/hub/HubService'

export interface ApiServices {
  authService: AuthService
  tokenService: TokenService
  hidraService: HidraService
  academyService: AcademyService
  cybervaultService: CybervaultService
  adminService: AdminService
  hubService: HubService
}
