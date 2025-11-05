import type { CSSProperties } from 'react';
import { useState, useCallback } from 'react';
import { colors, surfaces, typography } from '../../../../shared/design/tokens';
import type { FilePreview } from '../../../common/FileUpload';
import { Button, Card, CardContent, CardTitle, FileUpload, Input } from '../../../common';

export type CSVContactRow = {
  name: string;
  phone: string;
  email?: string;
  custom1?: string;
  custom2?: string;
  custom3?: string;
};

export type CSVImportResult = {
  totalRows: number;
  validRows: CSVContactRow[];
  invalidRows: Array<{ row: number; data: any; error: string }>;
  duplicateRows: Array<{ row: number; phone: string }>;
};

type CSVImportProps = {
  onImportComplete?: (result: CSVImportResult) => void;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

const requiredColumns = ['name', 'phone'];
const optionalColumns = ['email', 'custom1', 'custom2', 'custom3'];
const allColumns = [...requiredColumns, ...optionalColumns];

const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-numeric characters
  const cleanedPhone = phone.replace(/\D/g, '');

  // Check if it's a valid Brazilian phone number (10 or 11 digits)
  return cleanedPhone.length >= 10 && cleanedPhone.length <= 11;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const parseCSV = (text: string): string[][] => {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const result: string[][] = [];

  for (const line of lines) {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // Add the last value
    values.push(currentValue.trim());
    result.push(values);
  }

  return result;
};

export const CSVImport = ({
  onImportComplete,
  onCancel,
  loading = false,
  disabled = false,
}: CSVImportProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviews, setCsvPreviews] = useState<FilePreview[]>([]);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [csvContent, setCsvContent] = useState<string>('');
  const [parseResult, setParseResult] = useState<CSVImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.csv')) {
      setError('Por favor, selecione um arquivo CSV válido.');
      return;
    }

    setCsvFile(file);
    setError(null);
    setIsParsing(true);

    try {
      const text = await file.text();
      setCsvContent(text);

      // Parse CSV
      const rows = parseCSV(text);
      if (rows.length < 2) {
        throw new Error('O arquivo CSV deve conter pelo menos uma linha de cabeçalho e uma linha de dados.');
      }

      // Extract headers
      const headers = rows[0].map(h => h.toLowerCase().trim());

      // Validate required columns
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        throw new Error(`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}. Colunas aceitas: ${allColumns.join(', ')}`);
      }

      // Parse data rows
      const validRows: CSVContactRow[] = [];
      const invalidRows: Array<{ row: number; data: any; error: string }> = [];
      const duplicateRows: Array<{ row: number; phone: string }> = [];
      const seenPhones = new Set<string>();

      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        const contact: Partial<CSVContactRow> = {};

        // Map columns
        headers.forEach((header, index) => {
          const value = rowData[index] || '';
          if (header === 'name') contact.name = value;
          if (header === 'phone') contact.phone = value;
          if (header === 'email') contact.email = value;
          if (header === 'custom1') contact.custom1 = value;
          if (header === 'custom2') contact.custom2 = value;
          if (header === 'custom3') contact.custom3 = value;
        });

        // Validate required fields
        if (!contact.name?.trim()) {
          invalidRows.push({ row: i + 1, data: contact, error: 'Nome é obrigatório' });
          continue;
        }

        if (!contact.phone?.trim()) {
          invalidRows.push({ row: i + 1, data: contact, error: 'Telefone é obrigatório' });
          continue;
        }

        if (!validatePhoneNumber(contact.phone)) {
          invalidRows.push({ row: i + 1, data: contact, error: 'Telefone inválido' });
          continue;
        }

        // Validate optional fields
        if (contact.email && !validateEmail(contact.email)) {
          invalidRows.push({ row: i + 1, data: contact, error: 'Email inválido' });
          continue;
        }

        // Check for duplicates
        const cleanedPhone = contact.phone.replace(/\D/g, '');
        if (seenPhones.has(cleanedPhone)) {
          duplicateRows.push({ row: i + 1, phone: contact.phone });
          continue;
        }
        seenPhones.add(cleanedPhone);

        validRows.push({
          name: contact.name!,
          phone: contact.phone!,
          email: contact.email,
          custom1: contact.custom1,
          custom2: contact.custom2,
          custom3: contact.custom3,
        });
      }

      const result: CSVImportResult = {
        totalRows: rows.length - 1, // Exclude header
        validRows,
        invalidRows,
        duplicateRows,
      };

      setParseResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo CSV.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handlePreviewsChange = useCallback((previews: FilePreview[]) => {
    setCsvPreviews(previews);
  }, []);

  const handleImport = useCallback(() => {
    if (!parseResult || !segmentName.trim()) {
      setError('Preencha o nome do segmento para continuar.');
      return;
    }

    if (parseResult.validRows.length === 0) {
      setError('Não há contatos válidos para importar.');
      return;
    }

    onImportComplete?.(parseResult);
  }, [parseResult, segmentName, onImportComplete]);

  const handleCancel = useCallback(() => {
    setCsvFile(null);
    setCsvPreviews([]);
    setCsvContent('');
    setParseResult(null);
    setError(null);
    setSegmentName('');
    setSegmentDescription('');
    onCancel?.();
  }, [onCancel]);

  return (
    <div className="space-y-6" data-testid="csv-import-wizard">
      <header className="space-y-1">
        <h2
          className="text-xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Importar Contatos via CSV
        </h2>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Faça upload de um arquivo CSV com seus contatos para criar um novo segmento.
        </p>
      </header>

      {/* File Upload */}
      {!csvFile && (
        <Card variant="outlined">
          <CardTitle>Arquivo CSV</CardTitle>
          <CardContent>
            <FileUpload
              label="Selecione o arquivo CSV"
              description="Formatos aceitos: .csv. Colunas obrigatórias: name, phone. Opcionais: email, custom1, custom2, custom3"
              accept=".csv"
              multiple={false}
              maxSizeBytes={10 * 1024 * 1024} // 10MB
              value={csvFile ? [csvFile] : []}
              onFilesChange={handleFileChange}
              onPreviewsChange={handlePreviewsChange}
              disabled={disabled || isParsing}
              error={error}
              allowedTypes={['.csv']}
            />
          </CardContent>
        </Card>
      )}

      {/* Segment Information */}
      {csvFile && (
        <Card variant="outlined">
          <CardTitle>Informações do Segmento</CardTitle>
          <CardContent className="space-y-4">
            <Input
              label="Nome do Segmento"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="Ex: Clientes VIP, Leads de Outubro 2024"
              disabled={disabled}
              required
            />
            <Input
              label="Descrição (opcional)"
              value={segmentDescription}
              onChange={(e) => setSegmentDescription(e.target.value)}
              placeholder="Descreva este segmento para fácil identificação"
              disabled={disabled}
            />
          </CardContent>
        </Card>
      )}

      {/* Parse Results */}
      {parseResult && (
        <div className="space-y-4">
          <Card variant="outlined">
            <CardTitle>Resumo da Importação</CardTitle>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--total-color)]" style={{ '--total-color': colors.primary } as CSSProperties}>
                    {parseResult.totalRows}
                  </div>
                  <div className="text-xs text-[var(--label-color)]" style={{ '--label-color': colors.textSecondary } as CSSProperties}>
                    Total de Linhas
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--valid-color)]" style={{ '--valid-color': colors.accentSuccess } as CSSProperties}>
                    {parseResult.validRows.length}
                  </div>
                  <div className="text-xs text-[var(--label-color)]" style={{ '--label-color': colors.textSecondary } as CSSProperties}>
                    Válidos
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--invalid-color)]" style={{ '--invalid-color': colors.accentError } as CSSProperties}>
                    {parseResult.invalidRows.length}
                  </div>
                  <div className="text-xs text-[var(--label-color)]" style={{ '--label-color': colors.textSecondary } as CSSProperties}>
                    Inválidos
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--duplicate-color)]" style={{ '--duplicate-color': colors.accentWarning } as CSSProperties}>
                    {parseResult.duplicateRows.length}
                  </div>
                  <div className="text-xs text-[var(--label-color)]" style={{ '--label-color': colors.textSecondary } as CSSProperties}>
                    Duplicados
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invalid Rows Preview */}
          {parseResult.invalidRows.length > 0 && (
            <Card variant="outlined">
              <CardTitle>Linhas Inválidas (primeiras 10)</CardTitle>
              <CardContent>
                <div className="max-h-40 overflow-y-auto">
                  {parseResult.invalidRows.slice(0, 10).map((row, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded border border-[var(--invalid-border)] bg-[var(--invalid-bg)] p-2 text-xs"
                      style={{
                        '--invalid-border': colors.accentError,
                        '--invalid-bg': surfaces.errorTint,
                      } as CSSProperties}
                    >
                      <span>Linha {row.row}: {row.error}</span>
                    </div>
                  ))}
                  {parseResult.invalidRows.length > 10 && (
                    <div className="mt-2 text-center text-xs text-[var(--more-color)]" style={{ '--more-color': colors.textTertiary } as CSSProperties}>
                      ... e mais {parseResult.invalidRows.length - 10} linhas inválidas
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {csvFile && (
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={disabled || loading}
          >
            Cancelar
          </Button>
        )}
        {parseResult && parseResult.validRows.length > 0 && (
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={disabled || loading || !segmentName.trim()}
            loading={loading}
          >
            Importar {parseResult.validRows.length} Contato{parseResult.validRows.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </div>
  );
};

CSVImport.displayName = 'CSVImport';