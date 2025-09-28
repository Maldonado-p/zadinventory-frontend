// src/app/features/produtos/produto-list/produto-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { ProdutosService } from '../../../core/services/produtos.service';
import { CategoriasService } from '../../../core/services/categorias.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { TagsService } from '../../../core/services/tags.service';

import { Produto } from '../../../shared/models/produto';
import { Categoria } from '../../../shared/models/categoria';
import { Usuario } from '../../../shared/models/usuario';
import { Tag } from '../../../shared/models/tag';

@Component({
  selector: 'app-produto-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produto-list.component.html',
  styleUrls: ['./produto-list.component.scss'],
})
export class ProdutoListComponent implements OnInit {
  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];
  produtoSelecionado: Produto | null = null;

  categorias: Categoria[] = [];
  usuarios: Usuario[] = [];
  tagsDisponiveis: Tag[] = [];

  isLoading = false;

  filtro = {
    nome: '',
    categoriaId: null as number | null,
    precoMaximo: null as number | null,
    tagsIds: [] as number[],
  };

  constructor(
    private produtoService: ProdutosService,
    private categoriaService: CategoriasService,
    private usuarioService: UsuariosService,
    private tagService: TagsService
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarCategorias();
    this.carregarUsuarios();
    this.carregarTags();
  }

  carregarProdutos(): void {
    this.produtoService.listar().subscribe({
      next: (data: Produto[]) => {
        this.produtos = data;
        this.produtosFiltrados = [...data];
      },
      error: (err) => {
        console.error('Erro ao carregar produtos', err);
        Swal.fire('Erro', 'Não foi possível carregar os produtos', 'error');
      },
    });
  }

  carregarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (data: Categoria[]) => (this.categorias = data),
      error: (err) => {
        console.error('Erro ao carregar categorias', err);
        Swal.fire('Erro', 'Falha ao carregar categorias', 'error');
      },
    });
  }

  carregarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (data: Usuario[]) => (this.usuarios = data),
      error: (err) => {
        console.error('Erro ao carregar usuários', err);
        Swal.fire('Erro', 'Falha ao carregar usuários', 'error');
      },
    });
  }

  carregarTags(): void {
    this.tagService.listar().subscribe({
      next: (data: Tag[]) => (this.tagsDisponiveis = data),
      error: (err) => {
        console.error('Erro ao carregar tags', err);
        Swal.fire('Erro', 'Falha ao carregar tags', 'error');
      },
    });
  }

  // === FILTROS ===
  aplicarFiltros(): void {
    this.produtosFiltrados = this.produtos.filter((produto) => {
      if (
        this.filtro.nome &&
        !produto.nome.toLowerCase().includes(this.filtro.nome.toLowerCase())
      ) {
        return false;
      }

      if (
        this.filtro.categoriaId !== null &&
        produto.categoria?.id !== this.filtro.categoriaId
      ) {
        return false;
      }
      if (
        this.filtro.precoMaximo !== null &&
        (produto.preco ?? 0) > this.filtro.precoMaximo
      ) {
        return false;
      }

      if (this.filtro.tagsIds.length > 0) {
        const produtoTagsIds =
          produto.tags?.map((t) => t.id).filter((id) => id !== undefined) || [];
        const temTodasTags = this.filtro.tagsIds.every((tagId) =>
          produtoTagsIds.includes(tagId)
        );
        if (!temTodasTags) return false;
      }

      return true;
    });
  }

  toggleTagFiltro(tag: Tag): void {
    if (!tag.id) return;

    const index = this.filtro.tagsIds.indexOf(tag.id);
    if (index > -1) {
      this.filtro.tagsIds.splice(index, 1);
    } else {
      this.filtro.tagsIds.push(tag.id);
    }

    this.aplicarFiltros();
  }

  limparFiltros(): void {
    this.filtro = {
      nome: '',
      categoriaId: null,
      precoMaximo: null,
      tagsIds: [],
    };
    this.produtosFiltrados = [...this.produtos];
  }

  temFiltrosAtivos(): boolean {
    return (
      !!this.filtro.nome ||
      this.filtro.categoriaId !== null ||
      this.filtro.precoMaximo !== null ||
      this.filtro.tagsIds.length > 0
    );
  }

  // === CRUD ===
  novoProduto(): void {
    this.produtoSelecionado = {
      nome: '',
      descricao: '',
      quantidade: 0,
      preco: 0,
      categoria: null,
      usuario: null,
      tags: [],
    } as Produto;
  }

  editar(produto: Produto): void {
    this.produtoSelecionado = {
      ...produto,
      categoria: produto.categoria ? { ...produto.categoria } : null,
      usuario: produto.usuario ? { ...produto.usuario } : null,
      tags: produto.tags ? produto.tags.map((t) => ({ ...t })) : [],
    } as Produto;
  }

  excluir(produto: Produto): void {
    if (!produto.id) {
      Swal.fire('Erro', 'Produto sem ID válido.', 'error');
      return;
    }

    Swal.fire({
      title: 'Tem certeza?',
      text: `Excluir "${produto.nome}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.produtoService.excluir(produto.id!).subscribe({
          next: () => {
            Swal.fire('Excluído!', 'Produto removido com sucesso.', 'success');
            this.carregarProdutos();
          },
          error: (err) => {
            console.error('Erro ao excluir produto', err);
            const mensagemErro =
              err.error?.message || 'Não foi possível excluir o produto';
            Swal.fire('Erro', mensagemErro, 'error');
          },
        });
      }
    });
  }

  salvar(): void {
    if (!this.produtoSelecionado) return;

    if (
      !this.produtoSelecionado.nome ||
      !this.produtoSelecionado.categoria ||
      !this.produtoSelecionado.usuario
    ) {
      Swal.fire('Erro', 'Nome, categoria e usuário são obrigatórios.', 'error');
      return;
    }

    this.produtoSelecionado.preco = Number(
      Number(this.produtoSelecionado.preco).toFixed(2)
    );

    this.isLoading = true;

    const req = this.produtoSelecionado.id
      ? this.produtoService.atualizar(
          this.produtoSelecionado.id,
          this.produtoSelecionado
        )
      : this.produtoService.criar(this.produtoSelecionado);

    req.subscribe({
      next: () => {
        Swal.fire('Sucesso', 'Produto salvo com sucesso!', 'success');
        this.carregarProdutos();
        this.fecharModal();
      },
      error: (err) => {
        console.error('Erro ao salvar produto', err);
        const mensagemErro =
          err.error?.message || 'Não foi possível salvar o produto';
        Swal.fire('Erro', mensagemErro, 'error');
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  fecharModal(): void {
    this.produtoSelecionado = null;
    this.isLoading = false;
  }

  // === TAGS ===
  isTagSelected(tag: Tag): boolean {
    if (!this.produtoSelecionado?.tags) return false;
    return !!this.produtoSelecionado.tags.some((t) => t.id === tag.id);
  }

  toggleTag(tag: Tag, event: Event): void {
    if (!this.produtoSelecionado) return;
    if (!this.produtoSelecionado.tags) this.produtoSelecionado.tags = [];

    const input = event.target as HTMLInputElement | null;
    const checked = input?.checked ?? false;

    if (!tag.id) {
      console.warn('Tag sem ID ignorada', tag);
      return;
    }

    if (checked) {
      if (!this.produtoSelecionado.tags.some((t) => t.id === tag.id)) {
        this.produtoSelecionado.tags.push({ id: tag.id, nome: tag.nome });
      }
    } else {
      this.produtoSelecionado.tags = this.produtoSelecionado.tags.filter(
        (t) => t.id !== tag.id
      );
    }
  }
}
