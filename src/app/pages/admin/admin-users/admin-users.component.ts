import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminUser } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);

  users: AdminUser[] = [];
  selectedUser: AdminUser | null = null;
  showCreateForm = false;
  isLoading = false;

  form: Omit<AdminUser, 'id' | 'lastActive'> = {
    name: '',
    email: '',
    role: '',
    status: ''
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  selectUser(user: AdminUser): void {
    this.selectedUser = user;
    this.form = {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };
  }

  resetForm(): void {
    this.selectedUser = null;
    this.form = { name: '', email: '', role: '', status: '' };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  saveUser(): void {
    if (!this.form.name.trim() || !this.form.email.trim()) {
      return;
    }

    this.isLoading = true;
    const payload = {
      ...this.form,
      name: this.form.name.trim(),
      email: this.form.email.trim()
    };
    const isUpdate = !!this.selectedUser;
    const request = isUpdate
      ? this.adminApi.updateUser({ ...this.selectedUser!, ...payload })
      : this.adminApi.createUser(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(isUpdate ? 'Пользователь обновлен' : 'Пользователь создан');
          this.resetForm();
          this.loadUsers();
        },
        error: () => {
          this.toast.error('Не удалось сохранить пользователя');
        }
      });
  }

  deleteUser(user: AdminUser): void {
    const confirmation = globalThis.confirm('Отключить пользователя?');
    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.adminApi
      .deleteUser(user.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success('Пользователь удален');
          if (this.selectedUser?.id === user.id) {
            this.resetForm();
          }
          this.loadUsers();
        },
        error: () => {
          this.toast.error('Не удалось удалить пользователя');
        }
      });
  }

  private loadUsers(): void {
    this.isLoading = true;

    this.adminApi
      .getUsers()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: users => {
          this.users = users;
          if (this.selectedUser) {
            const updated = users.find(item => item.id === this.selectedUser?.id);
            if (updated) {
              this.selectUser(updated);
            }
          }
        },
        error: () => {
          this.toast.error('Не удалось загрузить пользователей');
        }
      });
  }
}
