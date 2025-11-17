import re
import pdfplumber
import pytesseract

def extract_text_from_pdf(pdf_path):
    """Extrai texto de um PDF usando pdfplumber."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text(layout=True, use_text_flow=True)
                if page_text:
                    text += page_text + "\n"
        if text.strip():
            # print("Texto extraído com pdfplumber.")
            return text
    except Exception as e:
        print(f"Erro com pdfplumber: {e}.")
    return text

def to_float(s):
    """Converte uma string numérica (com . e ,) para float."""
    return float(s.replace('.', '').replace(',', '.')) if s else None

def parse_detailed_items(text_block):
    """Parser de tabela super robusto que extrai todas as colunas de dados."""
    items = []
    line_pattern = re.compile(
        r"\((?P<code>.*?)\)\s+"
        r"(?P<desc>[\w\s./-]+?)\s+"
        r"(?P<unit>KWH|kW)\s+"
        r"(?P<numbers_str>.*)"
    )
    lines = text_block.strip().split('\n')
    for line in lines:
        match = line_pattern.search(line)
        if match:
            item_data = match.groupdict()
            numbers = re.findall(r'-?[\d.,]+', item_data['numbers_str'])
            item = {
                "codigo": item_data['code'].strip(),
                "descricao": item_data['desc'].strip(),
                "unidade": item_data['unit'].strip(),
                "quantidade": to_float(numbers[0]) if len(numbers) > 0 else None,
                "preco_unit_com_trib": to_float(numbers[1]) if len(numbers) > 1 else None,
                "valor_rs": to_float(numbers[2]) if len(numbers) > 2 else None,
                "cofins_pis_rs": to_float(numbers[3]) if len(numbers) > 3 else None,
                "base_calculo_icms_rs": to_float(numbers[4]) if len(numbers) > 4 else None,
                "aliquota_icms_percent": to_float(numbers[5]) if len(numbers) > 5 else None,
                "icms_rs": to_float(numbers[6]) if len(numbers) > 6 else None,
                "tarifa_unitaria_rs": to_float(numbers[7]) if len(numbers) > 7 else None,
            }
            if item["valor_rs"] is not None:
                items.append(item)
    return items

def parse_invoice_data(text):
    """Parser robusto construído com padrões validados para múltiplos layouts da Celesc."""
    if not text:
        return {}
    data = {}

    # Padrão 1: Nome do Cliente
    match = re.search(r'(.*)\s+NOME:', text)
    if not match:
        match = re.search(r'Pagador:\s*(.*)', text)
    if match:
        data['nome_cliente'] = match.group(1).strip()

    # Padrão 2: CPF/CNPJ
    match = re.search(r'([*\d.-]+)\s+CPF/CNPJ:', text)
    if match:
        data['cpf_cnpj'] = match.group(1).strip()

    # Unidade Consumidora
    table_pattern = re.compile(
        r"Data Documento\s*Número Referência\s*Unidade Consumidora\s*Nosso Número\s*Referência\s*Vencimento\s*Total a Pagar \(R\$\)\s*"
        r"(?P<data_documento>\d{2}/\d{2}/\d{4})\s+"
        r"(?P<numero_referencia>[\d-]+)\s+"
        r"(?P<unidade_consumidora>\d+)\s+"
        r"(?P<nosso_numero>\d+)\s+"
        r"(?P<mes_referencia>\d{2}/\d{4})\s+"
        r"(?P<data_vencimento>\d{2}/\d{2}/\d{4})\s+"
        r"(?P<valor_total_rodape>[\d.,]+)",
        re.DOTALL
    )
    footer_match = table_pattern.search(text)
    if footer_match:
        footer_data = footer_match.groupdict()
        data['data_documento'] = footer_data['data_documento'].strip()
        data['numero_referencia'] = footer_data['numero_referencia'].strip()
        data['numero_unidade_consumidora'] = footer_data['unidade_consumidora'].strip()
        data['nosso_numero'] = footer_data['nosso_numero'].strip()
        data['mes_referencia'] = footer_data['mes_referencia'].strip()
        data['data_vencimento'] = footer_data['data_vencimento'].strip()
        # Usa o valor do rodapé por ser mais confiável
        data['valor_total'] = to_float(footer_data['valor_total_rodape'])

    # Fallback (segurança): Se não achar o rodapé, tenta os métodos antigos
    if not data.get('numero_unidade_consumidora'):
        match = re.search(r'UNIDADE CONSUMIDORA\s*(\d+)', text, re.IGNORECASE)
        if match: data['numero_unidade_consumidora'] = match.group(1).strip()


    # Referência e Vencimento
    match = re.search(r'(\d{2}/\d{4})\s+(\d{2}/\d{2}/\d{4})', text)
    if match:
        data['mes_referencia'] = match.group(1).strip()
        data['data_vencimento'] = match.group(2).strip()

    # Chave de Acesso
    match = re.search(r'Chave de Acesso:\s*\n\s*([\d.]+)', text)
    if match:
        data['chave_acesso_nfe'] = match.group(1).strip().replace('.', '')

    # COSIP
    match = re.search(r'\((?:C0|CO)\) COSIP Municipal\s+[\d,.]+\s+[\d,.]+\s+([\d.,]+)', text)
    if match:
        data['cosip_municipal'] = to_float(match.group(1).strip())

    # Extração da tabela de itens
    match = re.search(r'(?s)(\(0D\) Consumo TE KWH.*?(?=SUBTOTAL))', text)
    if match:
        data['itens'] = parse_detailed_items(match.group(1))

    # =========================================================================
    # ### VALOR TOTAL (LÓGICA CORRIGIDA CONFORME SOLICITADO) ###
    # Procura por "Total a Pagar (R$)", ignora o primeiro número (UC)
    # e captura o segundo número (o valor correto).
    match = re.search(r"Total a Pagar \(R\$\)\s*\d+\s*([\d,.]+)", text)
    if match:
        data['valor_total'] = to_float(match.group(1).strip())
    # =========================================================================

    return {k: v for k, v in data.items() if v is not None}

def process_invoice_pdf(pdf_path):
    """Função principal que orquestra o processo."""
    extracted_text = extract_text_from_pdf(pdf_path)
    if extracted_text:
        invoice_data = parse_invoice_data(extracted_text)
        if not invoice_data:
            return {"error": "Texto extraído, mas nenhum dado correspondente foi encontrado."}
        return invoice_data
    else:
        return {"error": "Não foi possível extrair texto do PDF."}