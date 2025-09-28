import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { Usuario } from '../../../shared/models/usuario';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.scss'],
})
export class UsuarioListComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  usuarioSelecionado: Usuario | null = null;

filtro = {
    nome: '',
    email: '',
    tipoUsuario: null as string | null,
  };

  constructor(private usuarioService: UsuariosService) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (data: Usuario[]) => {
        this.usuarios = data;
        this.usuariosFiltrados = [...data];
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível carregar os usuários. Tente novamente mais tarde.',
        });
      },
    });
  }
aplicarFiltros(): void {
    this.usuariosFiltrados = this.usuarios.filter((usuario) => {
      if (
        this.filtro.nome &&
        !usuario.nome.toLowerCase().includes(this.filtro.nome.toLowerCase())
      ) {
        return false;
      }
      if (
        this.filtro.email &&
        !usuario.email.toLowerCase().includes(this.filtro.email.toLowerCase())
      ) {
        return false;
      }
      if (
        this.filtro.tipoUsuario !== null &&
        usuario.tipoUsuario !== this.filtro.tipoUsuario
      ) {
        return false;
      }
            return true;
    });
  }

  limparFiltros(): void {
    this.filtro = { nome: '', email: '', tipoUsuario: null };
    this.usuariosFiltrados = [...this.usuarios];
  }

  temFiltrosAtivos(): boolean {
    return (
      !!this.filtro.nome ||
      !!this.filtro.email ||
      this.filtro.tipoUsuario !== null
    );
  }
novoUsuario(): void {
    this.usuarioSelecionado = {
      nome: '',
      email: '',
      senha: '',
      tipoUsuario: 'FUNCIONARIO',
    } as Usuario;
  }

  editar(usuario: Usuario): void {
    this.usuarioSelecionado = { ...usuario };
  }

  excluir(usuario: Usuario): void {
    if (!usuario.id) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Usuário sem ID válido.',
      });
      return;
    }

    Swal.fire({
      title: 'Tem certeza?',
      text: `Excluir "${usuario.nome}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.excluir(usuario.id!).subscribe({
          next: () => {
            Swal.fire('Excluído!', 'Usuário removido com sucesso.', 'success');
            this.carregarUsuarios();
          },
          error: (err) => {
            console.error('Erro ao excluir usuário:', err);
            Swal.fire({
              icon: 'error',
              title: 'Erro',
              text: 'Não foi possível excluir o usuário.',
            });
          },
        });
      }
    });
  }

  salvar(): void {
    if (!this.usuarioSelecionado) return;

  if (!this.usuarioSelecionado.nome || !this.usuarioSelecionado.email) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Nome e e-mail são obrigatórios.',
      });
      return;
    }

    const req = this.usuarioSelecionado.id
      ? this.usuarioService.atualizar(
          this.usuarioSelecionado.id,
          this.usuarioSelecionado
        )
      : this.usuarioService.criar(this.usuarioSelecionado);

    req.subscribe({
      next: () => {
        Swal.fire('Sucesso', 'Usuário salvo com sucesso!', 'success');
        this.carregarUsuarios();
        this.usuarioSelecionado = null;
      },
      error: (err) => {
        console.error('Erro ao salvar usuário:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível salvar o usuário. Verifique os dados e tente novamente.',
        });
      },
    });
  }

  fecharModal(): void {
    this.usuarioSelecionado = null;
  }
}
