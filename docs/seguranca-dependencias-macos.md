# Dependências — análise de segurança separada

Registo de 6 de outubro de 2026, durante a continuação no Mac M2.

- Frontend: o utilizador reportou **67 vulnerabilidades** após `npm ci`, com Node **22.14.0** e npm **10.9.2**; `npx tsc --noEmit` passou. A contagem não identifica 67 falhas exploráveis na aplicação: falta recolher o relatório, gravidades, dependências diretas/transitivas e exposição em runtime/build.
- Backend: **AutoMapper 14.0.0**, aviso de segurança **NU1903**, já referido na documentação de estabilização. O utilizador confirmou compilação com .NET SDK **9.0.318**. Falta analisar o advisory, os usos afetados e uma correção compatível.

Estes avisos não foram corrigidos nesta passagem. Não foram alterados manifests ou lockfiles, nem executados `npm audit fix`, `--force` ou atualizações NuGet. A análise futura deve recolher relatórios apenas de leitura e propor alterações e validação separadamente; a contagem npm aqui é reportada pelo utilizador, não uma auditoria repetida.

A shell do agente usa por defeito Node 24.13.0/npm 11.6.2; o caminho instalado de Node 22.14.0 foi verificado e tem npm 10.9.2. Usar explicitamente esse ambiente na futura reprodução. Não foi mudado o default da shell.

## Atualização 07/10/2026 — partilha de cartões

A instalação dirigida de expo-sharing/react-native-view-shot e remoção de uma dependência direta desnecessária reportou **69 vulnerabilidades npm: 17 moderadas, 51 altas e 1 crítica**, com Node 22.14.0/npm 10.9.2. Manifests/lockfile alterados apenas para esta funcionalidade, usando versões mapeadas pelo SDK Expo local. Esta contagem global não atribui automaticamente as falhas aos novos pacotes nem substitui análise de exposição. Não executados npm audit fix, --force ou atualização automática generalizada. NU1903/AutoMapper 14.0.0 permanece para análise separada. O registo inicial de 67 fica como evidência histórica.
