# routers/fluxos.py (CÓDIGO COMPLETO CORRIGIDO)

import os
import shutil
import tempfile
import datetime
from fastapi import APIRouter, Depends, File, UploadFile, Query, Form, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse 

# --- Importações ReportLab ---
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from pathlib import Path
# --- Fim das Importações ReportLab ---

# Importações dos módulos do seu projeto
import crud
import models
import schemas
import security
from database import get_db
from extractor import process_invoice_pdf

# --- Configuração de Cores (Baseado no modelo eLUZ) ---
COLOR_ROXO_ESCURO = colors.HexColor('#4C2878') 
COLOR_ROXO_CLARO = colors.HexColor('#9C7AE0')
COLOR_VERDE_ECONOMIA = colors.HexColor('#5CB85C')
COLOR_FUNDO_CINZA = colors.HexColor('#f5f5f5')
COLOR_CINZA_CLARO = colors.HexColor('#f0f0f0') 

router = APIRouter(
    tags=["Fluxo Principal"]
)

# --- Constantes e Funções de Suporte ---

UPLOAD_DIRECTORY = "./anexos" 
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

def gerar_pdf_relatorio(fatura: models.Fatura, calculos: schemas.CalculoResponse) -> bytes:
    """
    Gera o conteúdo de um PDF de relatório estruturado, replicando o layout HTML/CSS com dados dinâmicos.
    (VERSÃO COM ALINHAMENTO CORRIGIDO E MELHORIAS ESTÉTICAS)
    """
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                            leftMargin=0.385 * inch, rightMargin=0.385 * inch, 
                            topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    
    styles = getSampleStyleSheet()
    Story = []

    # =========================================================================
    # --- BLOCO DE DEFINIÇÃO DE ESTILOS CUSTOMIZADOS (Deve vir antes do uso) ---
    # =========================================================================
    styles.add(ParagraphStyle(name='RoxoTitle', fontName='Helvetica-Bold', fontSize=30, textColor=COLOR_ROXO_ESCURO))
    styles.add(ParagraphStyle(name='RoxoTagline', fontName='Helvetica', fontSize=10, textColor=COLOR_ROXO_ESCURO, leading=11))
    styles.add(ParagraphStyle(name='SolarPhone', fontName='Helvetica-Bold', fontSize=12, textColor=COLOR_ROXO_ESCURO, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='SolarInfo', fontName='Helvetica', fontSize=9, textColor=colors.black, alignment=TA_RIGHT, leading=11))
    styles.add(ParagraphStyle(name='SmallText', fontName='Helvetica', fontSize=10, textColor=colors.black))
    styles.add(ParagraphStyle(name='ClientLabel', fontName='Helvetica-Bold', fontSize=10, textColor=colors.black))
    styles.add(ParagraphStyle(name='FaturaLabel', fontName='Helvetica', fontSize=12, textColor=colors.white))
    styles.add(ParagraphStyle(name='FaturaValue', fontName='Helvetica-Bold', fontSize=14, textColor=colors.white, alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='FaturaLargeValue', fontName='Helvetica-Bold', fontSize=24, alignment=TA_CENTER, textColor=colors.white))
    styles.add(ParagraphStyle(name='SectionHeaderPurple', fontName='Helvetica-Bold', fontSize=11, textColor=colors.white, backColor=COLOR_ROXO_ESCURO, alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='SectionHeaderLightPurple', fontName='Helvetica-Bold', fontSize=11, textColor=colors.white, backColor=COLOR_ROXO_CLARO, alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='TableTotal', fontName='Helvetica-Bold', fontSize=13, textColor=COLOR_ROXO_ESCURO, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='EconomyGreen', fontName='Helvetica-Bold', fontSize=16, textColor=COLOR_VERDE_ECONOMIA, alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='EconomyHeader', fontName='Helvetica-Bold', fontSize=18, textColor=COLOR_ROXO_ESCURO, alignment=TA_CENTER)) # Alinhamento corrigido por si
    styles.add(ParagraphStyle(name='AlignRightSmall', fontName='Helvetica', fontSize=10, alignment=TA_RIGHT, textColor=colors.black))
    styles.add(ParagraphStyle(name='AlignRightSmallBold', fontName='Helvetica-Bold', fontSize=10, alignment=TA_RIGHT, textColor=colors.black))
    styles.add(ParagraphStyle(name='EconomyValue', fontName='Helvetica-Bold', fontSize=14, textColor=COLOR_VERDE_ECONOMIA, alignment=TA_RIGHT,)) 
    styles.add(ParagraphStyle(name='SmallBold', fontName='Helvetica-Bold', fontSize=10, textColor=colors.black))
    styles.add(ParagraphStyle(name='RoxoSubTitle', fontName='Helvetica-Bold', fontSize=12, textColor=COLOR_ROXO_ESCURO)) 
    
    # --- NOVO ESTILO ADICIONADO ---
    # Este estilo é usado na tabela final para alinhar os valores monetários à direita
    styles.add(ParagraphStyle(name='SmallBoldRight', fontName='Helvetica-Bold', fontSize=10, textColor=colors.black, alignment=TA_RIGHT))
    
    # =========================================================================
    # --- FIM DA DEFINIÇÃO DE ESTILOS ---
    # =========================================================================

    # --- DEFINIÇÃO DAS LARGURAS TOTAIS DAS TABELAS ---
    # (Movido para aqui para corrigir o NameError: 'total_table_width' is not defined)
    total_table_width = (0.8 + 2.5 + 0.5 + 1.0 + 1.5 + 1.2) * inch # = 7.5 polegadas
    total_table_width_final = (4.5 + 3.0) * inch # = 7.5 polegadas

    # --- 2. HEADER TOP (Logo, Tagline, Info Solar) ---
    # (Seu código customizado de header)
    
    header_data = [
        [
            # Coluna 1: Logo e Tagline
            [
                Paragraph('<font face="Helvetica-Bold" color="#4C2878">eLUZ</font>', styles['RoxoTitle']),
            ],
            
            [
                Paragraph('energia renovável<br/>faça parte<br/>dessa corrente.', styles['RoxoTagline'])

            ],
            
            # Coluna 2: Info Solar
            [
                Paragraph('(48) 99152-3129', styles['SolarPhone']),
                Paragraph('lumiesolar.com.br<br/>Rua Altamiro Guimarães, 808<br/>Tubarão - SC', styles['SolarInfo'])
            ]
        ]
    ]
    header_table = Table(header_data, colWidths=[2.5*inch, 2.5*inch, 2.5*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LINEBELOW', (0, 0), (-1, 0), 2, COLOR_CINZA_CLARO),
    ]))
    Story.append(header_table)
    Story.append(Spacer(1, 0.2 * inch))
    
    # --- 3. CLIENTE E DETALHES DE COBRANÇA (GRID 2/3 vs 1/3) ---
    
    # 3a. Dados do Cliente (FUNDO CINZA)
    data_emissao_str = datetime.date.today().strftime("%d/%m/%Y")
    data_vencimento_str = getattr(fatura, 'data_vencimento', 'N/A')
    # Tratamento para formatar a data_vencimento se for um objeto date
    if isinstance(data_vencimento_str, datetime.date):
        data_vencimento_str = data_vencimento_str.strftime("%d/%m/%Y")
    
    client_info_content = [
        [Paragraph(f'<b>Cliente:</b> {fatura.nome_cliente}', styles['ClientLabel'])],
        [Paragraph(f'<b>CNPJ:</b> {fatura.cpf_cnpj}', styles['ClientLabel'])],
        [Paragraph(f'<b>Data de emissão:</b> {data_emissao_str}', styles['ClientLabel'])], 
        [Paragraph(f'<b>Unidade Consumidora:</b> {fatura.numero_unidade_consumidora}', styles['ClientLabel'])],
    ]
    client_info_table = Table(client_info_content, colWidths=[4.0*inch]) # Corrigido de 5.0 para 4.0
    client_info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_FUNDO_CINZA),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
    ]))
    
    # 3b. Detalhes da Cobrança (Blocos Roxos)
    
    billing_data = [
        # Linha 1: N.º Fatura e Vencimento
        [
            Paragraph('N.º Da Fatura:', styles['FaturaLabel']),
            Paragraph('Vencimento:', styles['FaturaLabel'])
        ],
        [
            Paragraph(f'<b>{fatura.id}</b>', styles['FaturaValue']),
            Paragraph(f'<b>{data_vencimento_str}</b>', styles['FaturaValue'])
        ],
        # Linha 2: REF e VALOR A PAGAR
        [
            Paragraph('Mês de Referencia:', styles['FaturaLabel']),
            Paragraph('Valor a Pagar:', styles['FaturaLabel']) 
        ],
        [
            Paragraph(f'<b>{fatura.mes_referencia}</b>', styles['FaturaValue']),
            Paragraph(f'<b> R${calculos.valor_final_a_pagar:.2f}</b>', styles['FaturaValue'])
            
        ],
    ]
    billing_table = Table(billing_data, colWidths=[1.75*inch, 1.75*inch], rowHeights=[0.2*inch, 0.3*inch, 0.2*inch, 0.3*inch])
    
    billing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 1), COLOR_ROXO_ESCURO), 
        ('BACKGROUND', (0, 2), (0, 3), COLOR_ROXO_ESCURO),
        ('BACKGROUND', (1, 2), (1, 3), COLOR_ROXO_CLARO), 
       
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    
    # 3c. Montar o Grid Cliente/Fatura
    grid_data = [[client_info_table, billing_table]]
    grid_table = Table(grid_data, colWidths=[4.0*inch, 3.5*inch])
    grid_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    Story.append(grid_table)
    

    # --- 4. SEÇÃO DE ECONOMIA (RESUMO COM DESTAQUE VERDE) ---
    
    # --- CORREÇÃO DE ALINHAMENTO DO TÍTULO DE ECONOMIA ---
    # 1. Dados do título em uma tabela que imita a de baixo
    economia_header_data = [[
        Paragraph('<br/>Economia com a Eluz Gestão', styles['EconomyHeader'])
    ]]
    
    # 3. Crie a Tabela do título, forçando a largura total E a altura da linha
    # --- CORREÇÃO DE NAMEERROR ---
    # Alterado 'header_table_data' para 'economia_header_data'
    header_table_obj = Table(economia_header_data, colWidths=[total_table_width], rowHeights=[0.3 * inch]) 
    
    # 4. Remova o padding da célula da tabela E ADICIONE VALIGN
    header_table_obj.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    # 5. Adicione a nova tabela (título) e o spacer
    Story.append(header_table_obj)
    Story.append(Spacer(1, 0.1 * inch))
    
    # Tabela de conteúdo da economia (como estava no seu código)
    economy_resumo_data = [
        [
            Paragraph('ECONOMIA NO MÊS', styles['SmallText']),
            Paragraph(f'<b>R$ {calculos.valor_desconto:.2f}</b>', styles['EconomyValue'])
        ]
    ]
    
    # As colWidths são mantidas para preservar o layout
    economy_table = Table(economy_resumo_data, colWidths=[4.0*inch, 3.5*inch])
    
    economy_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), COLOR_FUNDO_CINZA), # Ajustado para 2 colunas
        ('LINELEFT', (0, 0), (0, 0), 5, COLOR_ROXO_ESCURO), # Ajustado para col 0
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'), # Ajustado para col 1
        ('TEXTCOLOR', (1, 0), (1, 0), COLOR_VERDE_ECONOMIA), # Ajustado para col 1
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, 0), 10), # Ajustado para col 0
        ('RIGHTPADDING', (1, 0), (1, 0), 10), # Ajustado para col 1
    ]))
    Story.append(economy_table)
    Story.append(Spacer(1, 0.3 * inch))

    # --- 5. PRIMEIRA TABELA: DETALHES DA FATURA COMPLETA (ITENS + COSIP) ---
    
    # --- INÍCIO DA CORREÇÃO DE LARGURA DO TÍTULO ---
    # (A variável 'total_table_width' já foi definida no topo)

    # 2. Crie os dados para a tabela do título (uma linha, uma célula)
    header_table_data = [[
        Paragraph("FATURA DE ENERGIA COM O RECEBIMENTO DOS CRÉDITOS", styles['SectionHeaderPurple'])
    ]]
    
    # 3. Crie a Tabela do título, forçando a largura total E a altura da linha
    header_table_obj = Table(header_table_data, colWidths=[total_table_width], rowHeights=[0.3 * inch])
    
    # 4. Remova o padding da célula da tabela E ADICIONE VALIGN
    header_table_obj.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    # 5. Adicione a nova tabela (título) e o spacer
    Story.append(header_table_obj)
    Story.append(Spacer(1, 0.1 * inch))
    # --- FIM DA CORREÇÃO DE LARGURA DO TÍTULO ---

    # 5a. Cabeçalhos da Tabela
    detalhe_data = [
        [
            Paragraph('CÓDIGO', styles['SmallBold']), 
            Paragraph('DESCRIÇÃO', styles['SmallBold']), 
            Paragraph('UNIDADE', styles['SmallBold']), 
            Paragraph('QUANTIDADE', styles['SmallBold']), 
            Paragraph('VALOR UNITÁRIO (c/ trib.)', styles['SmallBold']), 
            Paragraph('VALOR (R$)', styles['SmallBold'])
        ]
    ]
    
    total_tabela_com_creditos = 0.0

    # 5b. Adicionar Itens da Fatura (fatura.itens)
    if fatura.itens:
        for item in fatura.itens:
            # Formatação dos valores
            quantidade_str = f"{item.quantidade:,.3f}" if item.quantidade is not None else 'N/A'
            preco_unit_str = f"R$ {item.preco_unit_com_trib:,.6f}" if item.preco_unit_com_trib is not None else 'N/A'
            valor_rs_item = item.valor_rs if item.valor_rs is not None else 0.0
            valor_rs_str = f"R$ {valor_rs_item:,.2f}"
            
            # --- CORREÇÃO (NoneType Error) ---
            # Envolvendo strings puras em Paragraph()
            detalhe_data.append([
                Paragraph(item.codigo or 'N/A', styles['SmallText']), 
                Paragraph(item.descricao or 'N/A', styles['SmallText']), 
                Paragraph(item.unidade or 'N/A', styles['SmallText']), 
                Paragraph(quantidade_str, styles['AlignRightSmall']), 
                Paragraph(preco_unit_str, styles['AlignRightSmall']),
                Paragraph(valor_rs_str, styles['AlignRightSmall'])
            ])
            total_tabela_com_creditos += valor_rs_item

    # 5c. Adicionar Linha do COSIP (Se existir)
    cosip_value = getattr(fatura, 'cosip_municipal', 0) or 0
    if cosip_value > 0:
        # --- CORREÇÃO (NoneType Error) ---
        # Envolvendo strings puras em Paragraph()
        detalhe_data.append([
            Paragraph('COSIP', styles['SmallText']), 
            Paragraph('Contribuição de Iluminação Pública', styles['SmallText']), 
            Paragraph('UNID', styles['SmallText']), 
            Paragraph('1', styles['AlignRightSmall']), 
            Paragraph(f"R$ {cosip_value:,.2f}", styles['AlignRightSmall']),
            Paragraph(f"R$ {cosip_value:,.2f}", styles['AlignRightSmall'])
        ])
        total_tabela_com_creditos += cosip_value
    
    # 5e. Adicionar linha de TOTAL para a primeira tabela
    detalhe_data.append([
        Paragraph('', styles['SmallBold']), # CÓDIGO vazio
        Paragraph('', styles['SmallBold']), # DESCRIÇÃO vazio
        Paragraph('', styles['SmallBold']), # UNIDADE vazio
        Paragraph('', styles['SmallBold']), # QUANTIDADE vazio
        Paragraph('TOTAL:', styles['TableTotal']), # Rótulo Total
        Paragraph(f"R$ {total_tabela_com_creditos:,.2f}", styles['TableTotal']) # Valor Total
    ])

    # 5d. Estilos da Primeira Tabela
    tbl_detalhe = Table(detalhe_data, colWidths=[0.8*inch, 2.5*inch, 0.5*inch, 1.0*inch, 1.5*inch, 1.2*inch])
    tbl_detalhe.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_FUNDO_CINZA),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'), 
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        
        # --- PADDING ADICIONADO (ESTÉTICA) ---
            
        
        # Estilo para a linha do total
        ('BACKGROUND', (0, -1), (-1, -1), COLOR_FUNDO_CINZA), # Fundo cinza na linha total
        ('SPAN', (0, -1), (4, -1)), # Mescla as primeiras 5 células da última linha
        ('ALIGN', (4, -1), (4, -1), 'RIGHT'), # Alinha o "TOTAL:" à direita
        ('ALIGN', (5, -1), (5, -1), 'RIGHT'), # Alinha o valor total à direita
        
        # --- PADDING ADICIONADO (ESTÉTICA) ---
        ('TOPPADDING', (0, -1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 4),
    ]))
    Story.append(tbl_detalhe)
    Story.append(Spacer(1, 0.3 * inch))

    # --- INÍCIO DA NOVA TABELA: FATURA SEM OS CRÉDITOS (COM VALORES NEGATIVOS ZERADOS) ---
    
    # --- INÍCIO DA CORREÇÃO DE LARGURA DO TÍTULO ---
    # (Usando a mesma largura total da tabela de 7.5 polegadas)
    header_table_data_2 = [[
        Paragraph("FATURA DE ENERGIA SEM O RECEBIMENTO DOS CRÉDITOS", styles['SectionHeaderPurple'])
    ]]
    header_table_obj_2 = Table(header_table_data_2, colWidths=[total_table_width], rowHeights=[0.3 * inch])
    header_table_obj_2.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    Story.append(header_table_obj_2)
    Story.append(Spacer(1, 0.1 * inch))
    # --- FIM DA CORREÇÃO DE LARGURA DO TÍTULO ---

    detalhe_sem_credito_data = [
        [
            Paragraph('CÓDIGO', styles['SmallBold']), 
            Paragraph('DESCRIÇÃO', styles['SmallBold']), 
            Paragraph('UNIDADE', styles['SmallBold']), 
            Paragraph('QUANTIDADE', styles['SmallBold']), 
            Paragraph('VALOR UNITÁRIO (c/ trib.)', styles['SmallBold']), 
            Paragraph('VALOR (R$)', styles['SmallBold'])
        ]
    ]

    total_tabela_sem_creditos = 0.0

    if fatura.itens:
        for item in fatura.itens:
            quantidade_str = f"{item.quantidade:,.3f}" if item.quantidade is not None else 'N/A'
            
            # Lógica para zerar valores negativos
            valor_rs_item = item.valor_rs if item.valor_rs is not None else 0.0
            valor_rs_processado = valor_rs_item if valor_rs_item >= 0 else 0.00
            valor_rs_str_processado = f"R$ {valor_rs_processado:,.2f}"

            preco_unit_item = item.preco_unit_com_trib if item.preco_unit_com_trib is not None else 0.0
            preco_unit_processado = preco_unit_item if preco_unit_item >= 0 else 0.00
            preco_unit_str_processado = f"R$ {preco_unit_processado:,.6f}"
            
            # --- CORREÇÃO (NoneType Error) ---
            # Envolvendo strings puras em Paragraph()
            detalhe_sem_credito_data.append([
                Paragraph(item.codigo or 'N/A', styles['SmallText']), 
                Paragraph(item.descricao or 'N/A', styles['SmallText']), 
                Paragraph(item.unidade or 'N/A', styles['SmallText']), 
                Paragraph(quantidade_str, styles['AlignRightSmall']), 
                Paragraph(preco_unit_str_processado, styles['AlignRightSmall']), 
                Paragraph(valor_rs_str_processado, styles['AlignRightSmall']) 
            ])
            total_tabela_sem_creditos += valor_rs_processado

    # Adicionar Linha do COSIP (mantém o mesmo, pois COSIP não é negativo)
    if cosip_value > 0:
        # --- CORREÇÃO (NoneType Error) ---
        # Envolvendo strings puras em Paragraph()
        detalhe_sem_credito_data.append([
            Paragraph('COSIP', styles['SmallText']), 
            Paragraph('Contribuição de Iluminação Pública', styles['SmallText']), 
            Paragraph('UNID', styles['SmallText']), 
            Paragraph('1', styles['AlignRightSmall']), 
            Paragraph(f"R$ {cosip_value:,.2f}", styles['AlignRightSmall']),
            Paragraph(f"R$ {cosip_value:,.2f}", styles['AlignRightSmall'])
        ])
        total_tabela_sem_creditos += cosip_value

    # Adicionar linha de TOTAL para a segunda tabela
    detalhe_sem_credito_data.append([
        Paragraph('', styles['SmallBold']), 
        Paragraph('', styles['SmallBold']), 
        Paragraph('', styles['SmallBold']), 
        Paragraph('', styles['SmallBold']), 
        Paragraph('TOTAL:', styles['TableTotal']), 
        Paragraph(f"R$ {total_tabela_sem_creditos:,.2f}", styles['TableTotal'])
    ])

    tbl_detalhe_sem_credito = Table(detalhe_sem_credito_data, colWidths=[0.8*inch, 2.5*inch, 0.5*inch, 1.0*inch, 1.5*inch, 1.2*inch])
    tbl_detalhe_sem_credito.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_FUNDO_CINZA),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'), 
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        
        # --- PADDING ADICIONADO (ESTÉTICA) ---
        ('TOPPADDING', (0, 0), (-1, 0), 4),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 4),

        # Estilo para a linha do total
        ('BACKGROUND', (0, -1), (-1, -1), COLOR_FUNDO_CINZA), 
        ('SPAN', (0, -1), (4, -1)), 
        ('ALIGN', (4, -1), (4, -1), 'RIGHT'), 
        ('ALIGN', (5, -1), (5, -1), 'RIGHT'), 
        
        # --- PADDING ADICIONADO (ESTÉTICA) ---
        ('TOPPADDING', (0, -1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 4),
    ]))
    Story.append(tbl_detalhe_sem_credito)
    Story.append(Spacer(1, 0.3 * inch))
    # --- FIM DA NOVA TABELA ---

    # --- 6. CÁLCULO DA ECONOMIA (Bloco final com correção de alinhamento) ---
    
    # --- INÍCIO DA CORREÇÃO DE LARGURA DO TÍTULO ---
    # (A variável 'total_table_width_final' já foi definida no topo)
    
    header_table_data_3 = [[
        Paragraph("DEMONSTRATIVO DE ECONOMIA", styles['SectionHeaderLightPurple'])
    ]]
    header_table_obj_3 = Table(header_table_data_3, colWidths=[total_table_width_final], rowHeights=[0.3 * inch])
    header_table_obj_3.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    Story.append(header_table_obj_3)
    Story.append(Spacer(1, 0.1 * inch))
    # --- FIM DA CORREÇÃO DE LARGURA DO TÍTULO ---
    
    # --- ALTERADO: Usando 'SmallBoldRight' para alinhar os valores ---
    calc_box_data = [
        [Paragraph("Fatura de energia sem o sistema solar fotovoltaico", styles['SmallText']), Paragraph(f"R$ {calculos.soma_valores_positivos:.2f}", styles['SmallBoldRight'])],
        [Paragraph("Fatura de energia com o sistema solar fotovoltaico", styles['SmallText']), Paragraph(f"R$ {fatura.valor_total:.2f}", styles['SmallBoldRight'])],
        [Paragraph("Subtotal(R$)", styles['SmallText']), Paragraph(f"R$ {(calculos.soma_valores_positivos)-(fatura.valor_total):.2f}", styles['SmallBoldRight'])],
        [Paragraph("REMUNERAÇÃO ELUZ", styles['SmallText']), Paragraph(f"R$ {calculos.valor_final_a_pagar:.2f}", styles['SmallBoldRight'])],
        # --- LINHA CORRIGIDA ---
        [Paragraph(f"<b>ECONOMIA REAL ({calculos.percentual_desconto_aplicado:.0f}%):</b>", styles['RoxoSubTitle']), Paragraph(f"R$ {calculos.valor_desconto:.2f}", styles['EconomyValue'])]
    ]
    
    tbl_calc_box = Table(calc_box_data, colWidths=[4.5*inch, 3.0*inch])
    tbl_calc_box.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#e6ffe6')), 
        ('TEXTCOLOR', (1, 2), (1, 2), COLOR_VERDE_ECONOMIA),
        ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
        
        # ('ALIGN', (1, 0), (-1, -1), 'RIGHT'), # Este comando é sobreposto pelo estilo do Parágrafo
        
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10), # Adicionado RIGHTPADDING para consistência
    ]))
    
    # --- REMOVIDO: Título redundante "CÁLCULO DA ECONOMIA" ---
    # Story.append(Paragraph('CÁLCULO DA ECONOMIA', styles['RoxoSubTitle']))
    # Story.append(Spacer(1, 0.1 * inch))
    
    Story.append(tbl_calc_box)
    Story.append(Spacer(1, 0.3 * inch))


    # --- Geração Final ---
    doc.build(Story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
# --- Endpoints (O RESTANTE DO ARQUIVO) ---

@router.post("/consumidores/{consumidor_id}/fatura", response_model=schemas.Fatura)
async def upload_fatura_consumidor(
    consumidor_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    db_consumidor = crud.get_consumidor(db, consumidor_id=consumidor_id)
    if not db_consumidor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumidor não encontrado.")
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formato de arquivo inválido.")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        extracted_data = process_invoice_pdf(tmp_path)
        if "error" in extracted_data:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=extracted_data["error"])

        
        # --- CORREÇÃO DE ESTRUTURA E VALIDAÇÃO ---
        itens_data = extracted_data.pop("itens", []) 
        
        # 2. Define o nome final e caminho
        filename = f"fatura_{consumidor_id}_{file.filename}"
        caminho_fisico_arquivo = os.path.join(UPLOAD_DIRECTORY, filename)
        caminho_relativo_db = f"anexos/{filename}" # Caminho que será usado na URL e no banco

        # 3. Cria o schema validado
        try:
            fatura_schema = schemas.FaturaCreate(
                consumidor_id=consumidor_id,
                itens=[schemas.ItemFaturaCreate(**item) for item in itens_data], 
                **extracted_data
            )
        except ValidationError as e:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Erro de validação Pydantic após extração: {e.errors()}")


        # 4. Verifica Duplicidade (usando a chave de acesso validada)
        db_fatura_existente = crud.get_fatura_by_chave_acesso(db, chave_acesso=fatura_schema.chave_acesso_nfe)
        if db_fatura_existente:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Uma fatura com esta chave de acesso já existe.")

        # 5. Salva o arquivo permanentemente
        shutil.move(tmp_path, caminho_fisico_arquivo)
        
        # 6. Cria o registro no banco
        return crud.create_fatura(
            db=db,
            fatura=fatura_schema,
            caminho_armazenamento=caminho_relativo_db,
            nome_arquivo_original=file.filename,
            consumidor_id=consumidor_id
        )

    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.errors())
    except HTTPException:
        raise
    except Exception as e:
        # Erros internos do Python/SQLAlchemy
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro interno inesperado: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path) # Limpa o arquivo temporário
        await file.close()


@router.post("/calculo/{fatura_id}/gerar-relatorio", response_model=schemas.CalculoComRelatorioResponse)
def calcular_e_gerar_relatorio(
    fatura_id: int,
    db: Session = Depends(get_db)
):
    fatura = crud.get_fatura(db=db, fatura_id=fatura_id)
    if not fatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fatura não encontrada")
    
    # Validação do vínculo e da porcentagem de desconto
    if not fatura.consumidor or not hasattr(fatura.consumidor, 'porcentagem_desconto'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fatura não vinculada a um consumidor com porcentagem de desconto.")

    porcentagem_do_consumidor = fatura.consumidor.porcentagem_desconto
    soma_itens_positivos = sum(item.valor_rs for item in fatura.itens if item.valor_rs is not None and item.valor_rs > 0)
    cosip = getattr(fatura, 'cosip_municipal', 0) or 0
    soma_total_positivos = soma_itens_positivos + cosip
    resultado_intermediario = soma_total_positivos - fatura.valor_total
    valor_desconto = resultado_intermediario * (porcentagem_do_consumidor / 100.0)
    valor_final_a_pagar = resultado_intermediario - valor_desconto

    resultados_calculo = schemas.CalculoResponse(
        fatura_id=fatura.id, valor_total_fatura=fatura.valor_total,
        soma_valores_positivos=round(soma_total_positivos, 2),
        resultado_intermediario=round(resultado_intermediario, 2),
        percentual_desconto_aplicado=porcentagem_do_consumidor,
        valor_desconto=round(valor_desconto, 2),
        valor_final_a_pagar=round(valor_final_a_pagar, 2)
    )

    conteudo_pdf_relatorio = gerar_pdf_relatorio(fatura, resultados_calculo)
    
    primeiro_nome = fatura.nome_cliente.split(" ")[0]
    mes_ref_formatado = fatura.mes_referencia.replace("/", "-")
    nome_arquivo_relatorio = f"{primeiro_nome}_{fatura.numero_unidade_consumidora}_{mes_ref_formatado}.pdf"
    
    caminho_fisico_relatorio = os.path.join(UPLOAD_DIRECTORY, nome_arquivo_relatorio)
    caminho_relativo_db = f"anexos/{nome_arquivo_relatorio}"
    
    with open(caminho_fisico_relatorio, "wb") as f:
        f.write(conteudo_pdf_relatorio)

    titulo_relatorio = f"Relatório de Análise - {fatura.mes_referencia}"
    
    db_relatorio = crud.create_relatorio(
        db, consumidor_id=fatura.consumidor_id, filename=nome_arquivo_relatorio,
        filepath=caminho_relativo_db,
        titulo=titulo_relatorio
    )

    return {"resultados_calculo": resultados_calculo, "relatorio_gerado": db_relatorio}


@router.get("/relatorios/{relatorio_id}/download", tags=["Relatórios"])
def download_relatorio(
    relatorio_id: int, 
    db: Session = Depends(get_db)
):
    db_relatorio = crud.get_relatorio(db, relatorio_id=relatorio_id)
    
    if not db_relatorio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relatório não encontrado.")

    # Constrói o caminho absoluto para o FileResponse
    from pathlib import Path
    BASE_DIR = Path(__file__).resolve().parent.parent # Vai para a pasta raiz da API
    file_location = BASE_DIR / db_relatorio.caminho_armazenamento # Ex: api/anexos/relatorio.pdf

    if not os.path.exists(file_location):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficheiro PDF não encontrado no servidor.")

    return FileResponse(
        file_location,
        media_type='application/pdf',
        headers={"Content-Disposition": "inline; filename=" + db_relatorio.nome_arquivo_original}
    )

@router.post("/consumidores/{consumidor_id}/boleto", response_model=schemas.Boleto)
async def upload_boleto_consumidor(
    consumidor_id: int,
    file: UploadFile = File(...),
    linha_digitavel: str = Form(...),
    valor_cobrado: float = Form(...),
    data_vencimento: datetime.date = Form(...),
    db: Session = Depends(get_db)
):
    db_consumidor = crud.get_consumidor(db, consumidor_id=consumidor_id)
    if not db_consumidor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumidor não encontrado.")
    
    filename = f"boleto_{consumidor_id}_{file.filename}"
    caminho_fisico_boleto = os.path.join(UPLOAD_DIRECTORY, filename)
    caminho_relativo_db = f"anexos/{filename}"
    
    with open(caminho_fisico_boleto, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    boleto_data = schemas.BoletoCreate(
        linha_digitavel=linha_digitavel,
        valor_cobrado=valor_cobrado,
        data_vencimento=data_vencimento
    )
    return crud.create_boleto(
        db, consumidor_id=consumidor_id, filename=file.filename,
        filepath=caminho_relativo_db,
        boleto_data=boleto_data
    )