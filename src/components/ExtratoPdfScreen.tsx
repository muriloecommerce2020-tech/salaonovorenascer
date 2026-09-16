import React, { useState, useRef } from 'react';
import { BANK_TRANSACTIONS } from '../data/mockData';
import { BankTransaction } from '../types';

export const ExtratoPdfScreen: React.FC = () => {
  const [fileName, setFileName] = useState<string>('Extrato_Bancario_Consolidado_Out_Nov_2024.pdf');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [monthIndex, setMonthIndex] = useState(1); // 0: Out, 1: Nov, 2: Dez
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pix' | 'card' | 'supply'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const months = ['Outubro / 2024', 'Novembro / 2024', 'Dezembro / 2024'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  const filteredTransactions = BANK_TRANSACTIONS.filter((t: BankTransaction) => {
    if (selectedFilter === 'all') return true;
    return t.category === selectedFilter;
  });

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setReportReady(true);
      setTimeout(() => {
        setReportReady(false);
      }, 3500);
    }, 1400);
  };

  return (
    <div className="flex flex-col w-full max-w-[480px] mx-auto px-5 pt-20 pb-28 min-h-screen">
      <div className="flex flex-col w-full gap-5">
        {/* Context Badge & Heading */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-[#cfe5d7]/70 text-[#273d33] border border-[#b6ccbe]/60">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Acesso Exclusivo Gestão
            </span>
          </div>
          <h1 className="font-serif-display text-[23px] font-semibold text-[#191c1c] tracking-tight leading-tight">
            Conciliação Financeira via Extrato PDF
          </h1>
          <p className="text-[12px] text-[#424844] leading-relaxed">
            Importe relatórios bancários para auditoria automática e cruzamento de faturamento em instantes.
          </p>
        </div>

        {/* Upload Drag & Drop Area */}
        <div className="flex flex-col bg-white rounded-xl p-4 shadow-xs border border-[#e1e3e2]/60 gap-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-4 rounded-xl text-center gap-2 cursor-pointer transition-all border-2 border-dashed ${
              isDragging
                ? 'bg-[#cfe5d7]/40 border-[#4c6358]'
                : 'bg-[#f3f4f3] border-[#c2c8c3] hover:bg-[#edeeed]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.csv,.ofx"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-[#cee9da] flex items-center justify-center text-[#4c6358] shadow-xs">
              <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[13px] font-bold text-[#191c1c]">
                Arraste ou toque para enviar o PDF
              </span>
              <span className="text-[11px] text-[#526259]">
                Extratos Itaú, Bradesco, Santander ou Nubank
              </span>
            </div>
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#4c6358] text-[12px] font-bold shadow-xs border border-[#e1e3e2] hover:bg-[#f3f4f3] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">attachment</span>
              <span>Selecionar arquivo PDF</span>
            </button>
          </div>

          {/* Active File Preview Card */}
          {fileName && (
            <div className="flex items-center justify-between p-3 bg-[#edeeed] rounded-lg border border-[#e1e3e2]/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#4c6358] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] text-[#191c1c] truncate font-bold">
                    {fileName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[#4c6358]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4c6358] animate-pulse" />
                    <span className="text-[11px] font-medium">Analisado com sucesso (348 transações)</span>
                  </div>
                </div>
              </div>
              <button
                aria-label="Remover arquivo"
                onClick={() => setFileName('')}
                className="p-1 text-[#526259] hover:text-[#ba1a1a] transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Reference Selector / Period of Analysis */}
        <div className="flex flex-col bg-white rounded-xl p-3.5 shadow-xs border border-[#e1e3e2]/60 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#526259] font-bold">
              Período de Análise
            </span>
            <button
              onClick={() => setIsCustomDate(!isCustomDate)}
              className="text-[11px] text-[#4c6358] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">calendar_month</span>
              <span>{isCustomDate ? 'Ver Mês' : 'Personalizar Datas'}</span>
            </button>
          </div>

          {!isCustomDate ? (
            <div className="flex items-center justify-between bg-[#f3f4f3] px-3 py-2 rounded-lg border border-[#e1e3e2]/50">
              <button
                aria-label="Mês anterior"
                disabled={monthIndex === 0}
                onClick={() => setMonthIndex(monthIndex - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#424844] hover:bg-[#e7e8e7] disabled:opacity-40 transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#4c6358]">
                  event_available
                </span>
                <span className="text-[13px] text-[#191c1c]">
                  Mês de Referência: <strong>{months[monthIndex]}</strong>
                </span>
              </div>
              <button
                aria-label="Próximo mês"
                disabled={monthIndex === months.length - 1}
                onClick={() => setMonthIndex(monthIndex + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#424844] hover:bg-[#e7e8e7] disabled:opacity-40 transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
              <div className="flex flex-col bg-[#f3f4f3] px-2.5 py-1.5 rounded-lg border border-[#e1e3e2]/50">
                <span className="text-[10px] text-[#526259]">Início</span>
                <input
                  type="date"
                  defaultValue="2024-11-01"
                  className="bg-transparent text-[12px] font-semibold text-[#191c1c] outline-none"
                />
              </div>
              <div className="flex flex-col bg-[#f3f4f3] px-2.5 py-1.5 rounded-lg border border-[#e1e3e2]/50">
                <span className="text-[10px] text-[#526259]">Término</span>
                <input
                  type="date"
                  defaultValue="2024-11-30"
                  className="bg-transparent text-[12px] font-semibold text-[#191c1c] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Financial Intelligence & Cash Flow */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-serif-display text-[17px] font-semibold text-[#191c1c]">
              Inteligência de Caixa
            </span>
            <span className="text-[11px] text-[#4c6358] font-bold">Balanço Auditado</span>
          </div>

          {/* Balance Hero Card */}
          <div className="flex flex-col bg-gradient-to-br from-[#4c6358] to-[#8fa89b] text-white rounded-xl p-4 shadow-md gap-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#cee9da] uppercase tracking-wider font-semibold">
                Saldo Líquido Real em Caixa
              </span>
              <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-medium text-white">
                <span className="material-symbols-outlined text-[13px]">trending_up</span>
                <span>+14.2% vs Out</span>
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-[16px] text-[#cee9da] font-semibold">R$</span>
              <span className="text-[30px] font-extrabold tracking-tight">7.348,00</span>
            </div>

            <div className="w-full bg-white/25 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#d2e8da] h-full rounded-full" style={{ width: '72%' }} />
            </div>

            <div className="flex justify-between items-center text-[11px] text-[#cee9da]">
              <span>Meta de Retenção: R$ 6.000</span>
              <span className="font-bold">Atingida (122%)</span>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 gap-2">
            {/* Entradas */}
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl shadow-xs border border-[#e1e3e2]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#cfe5d7] flex items-center justify-center text-[#4c6358]">
                  <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[#191c1c]">Entradas Identificadas</span>
                  <span className="text-[11px] text-[#526259]">214 transações compensadas</span>
                </div>
              </div>
              <span className="text-[16px] font-extrabold text-[#4c6358]">R$ 28.450,00</span>
            </div>

            {/* Despesas Operacionais */}
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl shadow-xs border border-[#e1e3e2]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[#191c1c]">Despesas Operacionais</span>
                  <span className="text-[11px] text-[#526259]">Aluguel, luz, insumos &amp; taxas</span>
                </div>
              </div>
              <span className="text-[16px] font-extrabold text-[#ba1a1a]">-R$ 11.230,00</span>
            </div>

            {/* Repasses de Comissões */}
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl shadow-xs border border-[#e1e3e2]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#edeeed] flex items-center justify-center text-[#526259]">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[#191c1c]">Repasses de Comissões</span>
                  <span className="text-[11px] text-[#526259]">11 profissionais credenciadas</span>
                </div>
              </div>
              <span className="text-[16px] font-extrabold text-[#191c1c]">-R$ 9.872,00</span>
            </div>
          </div>
        </div>

        {/* Auditoria de Conciliação */}
        <div className="flex flex-col bg-white rounded-xl p-4 shadow-xs border border-[#e1e3e2]/60 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-[#4c6358]">
                sync_saved_locally
              </span>
              <span className="font-serif-display text-[16px] font-semibold text-[#191c1c]">
                Auditoria de Conciliação
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#cfe5d7] text-[#273d33] text-[12px] font-extrabold">
              98.4% Match
            </span>
          </div>

          <div className="flex flex-col gap-2.5 bg-[#f3f4f3] p-3 rounded-lg border border-[#e1e3e2]/50">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#424844]">Faturamento no App (Sistemas)</span>
                <span className="font-bold text-[#191c1c]">R$ 28.910,00</span>
              </div>
              <div className="w-full bg-[#e1e3e2] h-2 rounded-full overflow-hidden">
                <div className="bg-[#95a69c] h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#424844]">Entradas no Extrato Bancário</span>
                <span className="font-bold text-[#4c6358]">R$ 28.450,00</span>
              </div>
              <div className="w-full bg-[#e1e3e2] h-2 rounded-full overflow-hidden">
                <div className="bg-[#4c6358] h-full rounded-full" style={{ width: '98.4%' }} />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-[#e7e8e7]/70 rounded-lg border border-[#e1e3e2]">
            <span className="material-symbols-outlined text-[20px] text-[#4c6358] shrink-0 mt-0.5">
              info
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] text-[#191c1c] font-bold">
                Divergência menor identificada: R$ 460,00
              </span>
              <p className="text-[11px] text-[#424844] mt-0.5 leading-relaxed">
                2 agendamentos finalizados no sábado (30/11) constam como compensação pendente D+1 para segunda-feira.
              </p>
            </div>
          </div>
        </div>

        {/* Movimentações do Extrato */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-serif-display text-[17px] font-semibold text-[#191c1c]">
              Movimentações do Extrato
            </span>
            <span className="text-[11px] text-[#526259]">Novembro 2024</span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all' as const, label: 'Todas (348)' },
              { id: 'pix' as const, label: 'Recebimentos Pix' },
              { id: 'card' as const, label: 'Maquininhas Cartão' },
              { id: 'supply' as const, label: 'Cosméticos & Insumos' }
            ].map((chip) => {
              const isSel = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#4c6358] text-white shadow-xs'
                      : 'bg-[#f3f4f3] text-[#424844] hover:bg-[#edeeed] border border-[#e1e3e2]/60'
                  }`}
                  type="button"
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Transactions List */}
          <div className="flex flex-col bg-white rounded-xl shadow-xs border border-[#e1e3e2]/60 overflow-hidden divide-y divide-[#e1e3e2]/50">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 hover:bg-[#f3f4f3] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'credit'
                        ? 'bg-[#cfe5d7] text-[#4c6358]'
                        : tx.category === 'supply'
                        ? 'bg-[#ffdad6] text-[#ba1a1a]'
                        : 'bg-[#edeeed] text-[#526259]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {tx.category === 'pix'
                        ? 'qr_code_2'
                        : tx.category === 'card'
                        ? 'credit_card'
                        : tx.category === 'supply'
                        ? 'shopping_bag'
                        : 'account_balance_wallet'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-[#191c1c] truncate">
                      {tx.title}
                    </span>
                    <span className="text-[11px] text-[#526259]">{tx.subtitle}</span>
                  </div>
                </div>
                <span
                  className={`text-[13px] font-extrabold shrink-0 ${
                    tx.type === 'credit' ? 'text-[#4c6358]' : tx.category === 'supply' ? 'text-[#ba1a1a]' : 'text-[#191c1c]'
                  }`}
                >
                  {tx.type === 'credit' ? '+' : '-'}R${' '}
                  {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary CTA: Closing Report */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full h-13 py-3.5 px-4 rounded-xl bg-[#4c6358] hover:bg-[#354c41] text-white text-[14px] font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            type="button"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
                <span>Compilando Balanço e Cruzando Transações...</span>
              </>
            ) : reportReady ? (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Relatório Pronto para Baixar!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">description</span>
                <span>Gerar Relatório de Fechamento Mensal</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-[#526259]">
            Exporta DRE simplificado, demonstrativo de comissões e balancete em PDF.
          </p>
        </div>
      </div>
    </div>
  );
};
