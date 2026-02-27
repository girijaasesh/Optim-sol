import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#faf8f3"><div style="text-align:center"><div style="font-size:2.5rem;margin-bottom:1rem">⏳</div><p style="color:#6b6358;font-size:0.9rem">Completing sign in…</p></div></div>`
})
export class OAuthCallbackComponent implements OnInit {
  private auth = inject(AuthService);
  ngOnInit(): void { this.auth.handleOAuthCallback(); }
}
