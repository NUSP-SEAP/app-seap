Olá.
Preciso fazer uma alteração substancial em um formulário do meu sistema, o formulário de Verificação de Salas "app/forms/checklist/index.html" (JS dessa página: "app/js/forms/checklist/index.js"; CSS dessa página: "app/css/forms/checklist/index.css")

Atualmente, o formulário está assim:
1) Ao entrar na página, o usuário se depara com o formulário "Verificação de Salas";
2) Nesse formulário, há um botão "Iniciar Testes" que, ao ser pressionado, inicia um cronômetro;
3) Abaixo desse campo, o usuário escolhe Data e o Local;
    a) Os campos que aparecem em "Itens Verificados" são padão para todas as salas selecionadas no campo "Local".
4) Há uma lista de "Itens Verificados" que não é fixa. O sistema busca essa lista no banco de dados, tabela "forms.checklist_item_tipo";
5) Após essa lista, há os campos "Trilha do Gravador 01" e "Trilha do Gravador 02";
6) Após os campos de Trilha, há o campo de "Observações";
7) Por fim, há os botões "Voltar", "Finalizar Testes" e "Salvar Verificação"
    a) O botão "Voltar" redireciona o usuário para a tela anterior
    b) O botão "Finalizar Testes" só funciona se o usuário estiver acionado o cronômetro anteriormente (no botão "Iniciar Testes"). Clicando nele, o cronômetro para de rodar;
    c) O botão "Salvar Verificação" só funciona se houver tempo no cronômetro, ou seja, somente se o usuário clicar em "Iniciar Testes" e depois em "Finalizar Testes".
8) Os campos obrigatórios são: "Data", "Local", pelo menos 1 item da lista de "Itens Verificados" e o tempo no cronômetro. Sem algum deles o formulário não será salvo.

Como este formulário deverá ser agora:
1) Não haverá mais botão para iniciar ou finalizar testes. Ao entrar na página, um cronômetro será acionado automaticamente e não ficará visível ao usuário (outra proposta é registrar o momento exato que o usuário entrar na página).
2) Os únicos campos disponíveis ao entrar na página serão "Data" e "Local".
3) Depois que o usuário preencher o campo "Data" e "Local", aparecerá um botão "Avançar"
4) Antes, a lista de "Itens Verificados" aparecia completa, com todos os itens que estão cadastrados na tabela "forms.checklist_item_tipo". Agora será diferente:
    a) O formulário exibirá somente um item de verificação depois que o usuário selecionar a data, o local e clicar em "Avançar".
    b) O item de verificação, que antes era comum para todas as salas, agora será específico para cada uma das salas da lista.
        1. Poderá haver itens comuns nas salas, mas também poderá haver itens específicos em uma ou mais salas. 
    c) O item de verificação será exibido da forma como é hoje: Nome dele no topo, opções "Ok" e "Falha"
    d) Ao selecionar a opção "Ok", aparecerá dentro do retângulo do item, abaixo das opções, um botão "Avançar"
    e) Ao selecionar a opção "Falha", aparecerá um campo de texto para o usuário descrever a falha (da forma como é hoje).
    f) Selecionando "Falha" e deixando o campo de descrever a falha em branco, não aparecerá botão para avançar. Se "Falha" for selecionado, o usuário deverá preencher alguma coisa no campo de descrever a falha (pelo menos 10 caracteres) para o botão de "Avançar" ficar visível abaixo do campo de descrever a falha.
    g) Ao clicar no botão "Avançar" de um item de verificação, o próximo item da lista (referente a sala selecionada anteriormente) será exibido, e o item de verificação que foi preenchido ficará invisível. Ou seja, somente um item de verificação será exibido por vez.
    h) Quando o usuário chegar no último item de verificação de determinada sala (todos os itens de verificação obedecerão o que informei nas letras "d", "e" e "f") o botão "Avançar" levará o usuário ao campo "Observações", que é fixo para a todas as salas.
    i) Os campos "Trilha do Gravador 01" e "Trilha do Gravador 02" não existirão mais de forma fixa. Eles poderão existir, dependendo da sala escolhida no início.

Sobre os itens de verificação que não são fixos:
1) Atualmente, o administrador pode incluir item novo, alterar o nome de item, alterar a ordem dos itens e desabilitar algum item existente, para que ele não seja mostrado no formulário. Da forma como está hoje, a alteração vale para todas as salas.
2) Essa funcionalidade deverá continuar existindo, porém, deverá ser adaptada para as especificações de cada sala, que antes não existia.
    a) Precisamos encontrar uma maneira de disponibilizar ao administrador a alteração dos itens de sala por sala e uma alteração geral (que fique valendo para todas as salas). Pois, alguns itens de verificação sempre serão comuns a todas as salas; outros existirão na maioria das salas; já outros existirão somente em 1 ou 2 salas.

Sobre o banco de dados referente a este formulário:
1) Toda estrutura dele está no arquivo "n8n_data.sql"
2) As tabelas estão no schema "forms" ("forms.checklist", "forms.checklist_item_tipo", e "forms.checklist_resposta")
3) Como explicado anteriormente, os itens de verificação eram padrões para todas as salas. Com essa mudança (diferenciação de itens por sala), o banco de dados também terá que ser adaptado.

Com toda essa explicação, quero que me ajude em uma solução para o novo formulário de Verificação de Salas. 
Antes de passar linhas de código, quero que me explique novamente tudo que eu falei (o antes e depois do formulário), analisando os arquivos que estou te enviando em anexo (são pacotes .md feitos pelo Repomix. Não coloquei todos os arquivos, somente os que acho que serão necessários para o caso. Se faltar algum, me peça.)