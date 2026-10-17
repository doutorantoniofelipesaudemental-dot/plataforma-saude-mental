' Executa um comando do projeto SEM janela de console (nao da para fechar nem dar Ctrl+C sem querer)
' e devolve o codigo de saida ao Agendador de Tarefas (para ele poder reiniciar se falhar).
' Uso (feito pelo agendar-tarefas-windows.ps1):
'   wscript.exe //B //Nologo rodar-oculto.vbs "<arquivo de log>" "<caminho do node.exe>" "<argumentos do node>"
Option Explicit
Dim sh, fso, raiz, log, node, args, cmd, rc
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
raiz = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
If WScript.Arguments.Count < 3 Then WScript.Quit 2
log = WScript.Arguments(0)
node = WScript.Arguments(1)
args = WScript.Arguments(2)
cmd = "cmd.exe /c cd /d """ & raiz & """ && """ & node & """ --env-file=.env " & args & " >> """ & log & """ 2>&1"
rc = sh.Run(cmd, 0, True)
WScript.Quit rc
