# test_extraction.py

import sys
from extractor import extract_text_from_pdf # Importa a função do seu arquivo principal

# Verifica se o caminho do PDF foi fornecido como argumento
if len(sys.argv) < 2:
    print("\nERRO: Você esqueceu de fornecer o caminho do PDF.")
    print("Uso correto: python test_extraction.py \"caminho/para/sua/fatura.pdf\"\n")
    sys.exit(1)

pdf_file_path = sys.argv[1]

print(f"\n--- Tentando extrair texto de: {pdf_file_path} ---\n")

# Chama a função de extração do seu arquivo extractor.py
text = extract_text_from_pdf(pdf_file_path)

# Verifica se algum texto foi retornado
if text and text.strip():
    print("--- Texto Extraído com Sucesso ---\n")
    print(text)
    print("\n--- Fim do Texto ---")
else:
    print("!!! FALHA: Nenhum texto foi extraído do PDF. !!!")
    print("Verifique se o caminho do arquivo está correto e se o PDF não está vazio ou corrompido.")