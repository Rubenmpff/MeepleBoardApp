# Dependências — análise de segurança separada

Registo de 6 de outubro de 2026, durante a continuação no Mac M2.

- Frontend: o utilizador reportou **67 vulnerabilidades** após `npm ci`, com Node **22.14.0** e npm **10.9.2**; `npx tsc --noEmit` passou. A contagem não identifica 67 falhas exploráveis na aplicação: falta recolher o relatório, gravidades, dependências diretas/transitivas e exposição em runtime/build.
- Backend: **AutoMapper 14.0.0**, aviso de segurança **NU1903**, já referido na documentação de estabilização. O utilizador confirmou compilação com .NET SDK **9.0.318**. Falta analisar o advisory, os usos afetados e uma correção compatível.

Estes avisos não foram corrigidos nesta passagem. Não foram alterados manifests ou lockfiles, nem executados `npm audit fix`, `--force` ou atualizações NuGet. A análise futura deve recolher relatórios apenas de leitura e propor alterações e validação separadamente; a contagem npm aqui é reportada pelo utilizador, não uma auditoria repetida.

A shell do agente usa por defeito Node 24.13.0/npm 11.6.2; o caminho instalado de Node 22.14.0 foi verificado e tem npm 10.9.2. Usar explicitamente esse ambiente na futura reprodução. Não foi mudado o default da shell.
