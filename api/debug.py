# ARQUIVO: debug.py (Sem a função search_and_get)

import re
import json
import traceback

# Texto da fatura complexa
pdf_text = """
SEGUNDA VIA




                                    Iluminação pública: Palhoca - 0800 606-1535
    INDUSTRIAL - INDUSTRIAL - B3 Outros demais classes - TRIFÁSICO
    NOME:GILBERTO CRISTIAN GAMBALONGA
                                26554837
    CPF/CNPJ: ***.197.699-**
    ENDERECO:CHAPECO 192 - BELA VISTA - PH Cliente:58976610 NOTA FISCAL Nº051958269 SERIE:001 DATA EMISSAO:24/06/2025
                            Etapa: 16              Consulte Chave de Acesso em:
    CEP:88132-743 CIDADE:PALHOCA SC Grupo/Subgrupo Tensão:B/B3 https://sat.sef.sc.gov.br/nf3e/consulta
                                                   Chave de Acesso:
                                                   4225.0608.3367.8300.0190.6600.1051.9582.6910.4188.8681
                                                   Protocolo de Autorização:3.422.500.023.759.773 - 24/06/2025 às 21:11        
      06/2025   11/08/2025     R$ 707,60
                                  Comunicado importante


      23/05/2025  24/06/2025 32      Lida       24/07/2025  Amarela R$ 0,01885 8
                                                            Vermelha - Patamar 1 R$ 0,04463 24

     1919554  Energia  Único  3.385 8.835 1,00000 0,00 5.450
                                                           PIS   68,75  0,81 0,57
                                                           COFINS 68,75 3,72 2,56
                                                           ICMS  2.214,14 17,00 376,40

                                                                 Consumo Faturado Dias Faturados
                                                            MAI/25       4521 29
    (0D) Consumo TE KWH 5.450,000 0,381424 2.078,76 78,16 2.078,76 17,00 353,39 0,302240
    (0E) Consumo TUSD KWH 5.450,000 0,398372 2.171,13 81,64 2.171,13 17,00 369,09 0,315670 ABR/25 4497 30
    (0R) Energia Injet. TE KWH 3.086,011 -0,381418 -1.177,06 -44,25 -1.177,06 17,00 -200,10 0,302240 MAR/25 4317 29
    (0R) Energia Injet. TE KWH 2.263,989 -0,381420 -863,53 -32,47 -863,53 17,00 -146,80 0,302240 FEV/25 4920 32
    (0S) Energia Inj. TUSD KWH 2.263,989 -0,330647 -748,58 -33,91 0,00 0,00 0,00 0,315670 JAN/25 4221 31
    (0S) Energia Inj. TUSD KWH 3.086,011 -0,330650 -1.020,39 -46,23 0,00 0,00 0,00 0,315670
                                                            DEZ/24       4836 20
    (2L) Bandeira Amarela KWH 5.450,000 0,005947 32,41 1,22 32,41 17,00 5,51 0,004713
    (2M) Band. Am. Injet. KWH 5.350,000 -0,005946 -31,81 -1,19 -31,81 17,00 -5,41 0,004713
    (2U) Band. Vermelha KWH 5.450,000 0,042244 230,23 8,66 230,23 17,00 39,14 0,033473
    (2V) Band. Vrm. Injet. KWH 5.350,000 -0,042241 -225,99 -8,50 -225,99 17,00 -38,42 0,033473
    SUBTOTAL                  445,17
    (C0) COSIP Municipal 0,000 0,000000 262,43 0,00 0,00 0,00 0,00 0,000000
    SUBTOTAL                  262,43
    TOTAL                     707,60
"""

# ===== FUNÇÕES AUXILIARES =====
def to_float(s):
    return float(s.replace('.', '').replace(',', '.')) if s else None

def parse_detailed_items(text_block):
    items = []
    line_pattern = re.compile(
        r"\((?P<code>.*?)\)\s+"
        r"(?P<desc>[\w\s./-]+?)\s+"
        r"(?:KWH|kW)\s+"
        r"(?P<numbers_str>.*)"
    )
    lines = text_block.strip().split('\n')
    for line in lines:
        match = line_pattern.search(line)
        if match:
            item_data = match.groupdict()
            numbers = re.findall(r'-?[\d.,]+', item_data['numbers_str'])
            if len(numbers) >= 3:
                item = {
                    "codigo": item_data['code'].strip(),
                    "descricao": item_data['desc'].strip(),
                    "quantidade": to_float(numbers[0]),
                    "preco_unitario": to_float(numbers[1]),
                    "valor_rs": to_float(numbers[2]),
                }
                items.append(item)
    return items

def parse_history_table(text_block):
    history = {}
    def extract_line_values(label, text):
        match = re.search(fr'{label}\s+([\d\s]+)', text)
        if match:
            numbers_as_strings = match.group(1).strip().split()
            return [int(n) for n in numbers_as_strings if n]
        return None
    history['consumo_beneficiaria_periodo'] = extract_line_values('Consumo Beneficiária no Período Atual', text_block)
    history['injecao_periodo'] = extract_line_values('Injeção no Período Atual', text_block)
    history['saldo_beneficiaria_mes_anterior'] = extract_line_values('Saldo Beneficiária Mês Anterior', text_block)
    history['saldo_final_beneficiaria'] = extract_line_values('Saldo Final Beneficiária', text_block)
    return {k: v for k, v in history.items() if v is not None}

# ===== FUNÇÃO PRINCIPAL SEM search_and_get =====
def parse_invoice_data(text):
    if not text: return {}
    data = {}

    # Bloco 1: Dados do Cliente
    match = re.search(r'NOME:(.*?)(?=\s+\d|\n)', text, re.DOTALL | re.MULTILINE)
    if match: data['nome_cliente'] = match.group(1).strip()
    
    match = re.search(r'CPF/CNPJ:\s*([*\d.-]+)', text, re.DOTALL | re.MULTILINE)
    if match: data['cpf_cnpj'] = match.group(1).strip()
    
    match = re.search(r'ENDERECO:(.*?)Cliente:', text, re.DOTALL | re.MULTILINE)
    if match: data['endereco'] = ' '.join(match.group(1).replace('\n', ' ').split())
    
    match = re.search(r'Chave de Acesso:\s*([\d.]+)', text, re.DOTALL | re.MULTILINE)
    if match: data['chave_acesso_nfe'] = match.group(1).strip()

    # Bloco 2: Dados da Tabela de Rodapé
    match_footer = re.search(r'(Data Documento Número Referência.*?(?=PAGUE COM PIX|SEGUNDA VIA\s*$))', text, re.DOTALL | re.MULTILINE)
    if match_footer:
        footer_text = match_footer.group(1)
        match = re.search(r'\d{2}/\d{2}/\d{4}\s+[\d-]+?(\d{9})\s', footer_text, re.DOTALL | re.MULTILINE)
        if match: data['nota_fiscal_numero'] = match.group(1).strip()

        match = re.search(r'Unidade Consumidora\s+.*?(\d{8,10})\s', footer_text, re.DOTALL | re.MULTILINE)
        if match: data['numero_cliente_conta'] = match.group(1).strip()
        
        match = re.search(r'(\d{2}/\d{4})\s+\d{2}/\d{2}/\d{4}', footer_text, re.DOTALL | re.MULTILINE)
        if match: data['mes_referencia'] = match.group(1).strip()
        
        match = re.search(r'\d{2}/\d{4}\s+(\d{2}/\d{2}/\d{4})', footer_text, re.DOTALL | re.MULTILINE)
        if match: data['data_vencimento'] = match.group(1).strip()

    # Bloco 3: Consumo e Dias
    match = re.search(r'Energia\s+Único.*?([\d.,]+)\s*$', text, re.DOTALL | re.MULTILINE)
    if match: data['consumo_kwh_mes'] = to_float(match.group(1).strip())
    
    match = re.search(r'\d{2}/\d{2}/\d{4}\s+\d{2}/\d{2}/\d{4}\s+(\d+)\s+Lida', text, re.DOTALL | re.MULTILINE)
    if match: data['dias_faturados'] = int(match.group(1).strip())
            
    # Bloco 4: Valores Finais
    match = re.search(r'\bTOTAL\b\s+([\d.,]+)', text, re.DOTALL | re.MULTILINE)
    if match: data['valor_total'] = to_float(match.group(1).strip())
    
    match = re.search(r'\((?:C0|CO)\)\s+COSIP\s+Municipal\s+[\d,.]+\s+[\d,.]+\s+([\d.,]+)', text, re.DOTALL | re.MULTILINE)
    if match: data['cosip_municipal'] = to_float(match.group(1).strip())

    # Bloco 5: Tabelas de Detalhes
    match = re.search(r'(?s)(\(0D\) Consumo TE KWH.*?(?=SUBTOTAL))', text, re.DOTALL | re.MULTILINE)
    if match: data['itens_faturados'] = parse_detailed_items(match.group(1))

    match = re.search(r'(?s)(JUN/25 MAI/25.*?(?=Maiores informações))', text, re.DOTALL | re.MULTILINE)
    if match: data['historico_consumo_injecao'] = parse_history_table(match.group(1))

    return {k: v for k, v in data.items() if v is not None}

# =========================================================================
# Execução do Teste
# =========================================================================

try:
    print("--- INICIANDO TESTE SEM FUNÇÃO PROBLEMÁTICA ---")
    extracted_data = parse_invoice_data(pdf_text)
    print("\n--- DADOS EXTRAÍDOS COM SUCESSO ---\n")
    print(json.dumps(extracted_data, indent=2, ensure_ascii=False))
except Exception:
    print(f"\n!!!!!! OCORREU UM ERRO DURANTE O PARSING !!!!!!\n")
    print(traceback.format_exc())
finally:
    print("\n--- FIM DO TESTE ---")