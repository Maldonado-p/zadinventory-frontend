import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { OperacoesService } from '../../../core/services/operacoes.service';
import { Operacao } from '../../../shared/models/operacao';

@Component({
  selector: 'app-operacao-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operacao-list.component.html',
  styleUrls: ['./operacao-list.component.scss'],
})
export class OperacaoListComponent implements OnInit {
  operacoes: Operacao[] = [];
  operacaoSelecionada: Operacao | null = null;
  isLoading = false;

  constructor(private operacoesService: OperacoesService) {}

  ngOnInit(): void {
    this.carregarOperacoes();
  }

  carregarOperacoes(): void {
    this.operacoesService.listar().subscribe({
      next: (data: Operacao[]) => {
        this.operacoes = data;
      },
      error: (err) => {
        console.error('Erro ao carregar operações', err);
        const mensagemErro =
          err.error?.message || 'Não foi possível carregar as operações';
        Swal.fire('Erro', mensagemErro, 'error');
      },
    });
  }

  novaOperacao(): void {
    this.operacaoSelecionada = {
      tipo: 'ENTRADA',
      valor: 0,
      data: new Date().toISOString().split('T')[0], // formato "YYYY-MM-DD"
      descricao: '',
    };
  }

  editar(operacao: Operacao): void {
    this.operacaoSelecionada = { ...operacao };
  }

  excluir(operacao: Operacao): void {
    Swal.fire({
      title: 'Tem certeza?',
      text: `Excluir operação #${operacao.id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.operacoesService.excluir(operacao.id!).subscribe({
          next: () => {
            Swal.fire(
              'Excluída!',
              'Operação removida com sucesso.',
              'success'
            );
            this.carregarOperacoes();
          },
          error: (err) => {
            console.error('Erro ao excluir operação', err);
            const mensagemErro =
              err.error?.message || 'Não foi possível excluir a operação';
            Swal.fire('Erro', mensagemErro, 'error');
          },
        });
      }
    });
  }

  salvar(): void {
    if (!this.operacaoSelecionada) return;

    this.isLoading = true;

    const req = this.operacaoSelecionada.id
      ? this.operacoesService.atualizar(
          this.operacaoSelecionada.id,
          this.operacaoSelecionada
        )
      : this.operacoesService.criar(this.operacaoSelecionada);

    req.subscribe({
      next: () => {
        Swal.fire('Sucesso', 'Operação salva com sucesso!', 'success');
        this.carregarOperacoes();
        this.fecharModal();
      },
      error: (err) => {
        console.error('Erro ao salvar operação', err);
        const mensagemErro =
          err.error?.message || 'Não foi possível salvar a operação';
        Swal.fire('Erro', mensagemErro, 'error');
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  fecharModal(): void {
    this.operacaoSelecionada = null;
    this.isLoading = false;
  }
}
