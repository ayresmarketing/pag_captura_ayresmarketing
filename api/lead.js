/* Função serverless (Vercel) — recebe o formulário e dispara o lead no WhatsApp via Mega API.
   O token fica APENAS na variável de ambiente MEGAAPI_TOKEN (painel do Vercel), nunca no git.
   A instância (megacode-<token>) é derivada do token, então também não aparece no código. */

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const token = process.env.MEGAAPI_TOKEN;
    if (!token) {
      res.status(500).json({ ok: false, error: 'MEGAAPI_TOKEN nao configurado no Vercel' });
      return;
    }

    // Body (o Vercel já entrega objeto quando o content-type é JSON; tratamos string por segurança)
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const nome        = String(body.nome || '').trim();
    const email       = String(body.email || '').trim();
    const whatsappRaw = String(body.whatsapp || '').trim();
    const tipo        = String(body.tipo || '').trim();
    const faturamento = String(body.faturamento || '').trim();
    const plano       = String(body.plano || '').trim();

    if (!nome || !email || !whatsappRaw || !tipo || !faturamento) {
      res.status(400).json({ ok: false, error: 'Campos obrigatorios faltando' });
      return;
    }

    // Normaliza o número da pessoa: só dígitos e garante o DDI 55
    let num = whatsappRaw.replace(/\D/g, '');
    if (num.length <= 11) num = '55' + num;

    const texto =
`Opa, Samuel. Tenho um lead da página de infoprodutos aqui pra você:

Nome: ${nome}

E-mail: ${email}

WhatsApp: wa.me/${num}

Plano de interesse: ${plano || 'Não informado'}

O lead é: ${tipo}

Faturamento médio nos últimos 12 meses: ${faturamento}`;

    const url = `https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-${token}/text`;

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        messageData: { to: '553188183316', text: texto }
      })
    });

    const detail = await apiRes.text();
    if (!apiRes.ok) {
      res.status(502).json({ ok: false, error: 'Falha no envio para a Mega API', detail });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
};
