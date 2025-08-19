import React, { useState } from 'react';
import { Link } from 'react-router-dom';
const ParceriasPage = () => {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        instagram: '',
        publico: ''
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        const message = `Olá! Gostaria de me tornar parceira da CíliosClick 💄

*Meus dados:*
Nome: ${formData.nome}
Email: ${formData.email}
Telefone: ${formData.telefone}
Instagram: ${formData.instagram}
Público: ${formData.publico}

Aguardo retorno para receber meu cupom exclusivo! 🎉`;
        const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    return (<div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      
      <header className="bg-white/80 backdrop-blur-sm shadow-elegant">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
                <span className="text-white text-xl">💄</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                CíliosClick
              </h1>
            </div>
            <Link to="/login" className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-3 rounded-2xl transition-all transform hover:scale-105 shadow-elegant font-medium">
              ✨ Fazer Login
            </Link>
          </div>
        </div>
      </header>

      
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Seja uma <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Parceira</span> CíliosClick
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            ✨ Transforme sua influência em renda! Indique nossa plataforma revolucionária 
            de aplicação virtual de cílios e ganhe <strong className="text-primary-600">20% de comissão</strong> 
            em cada venda.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="card-interactive text-center group">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                20%
              </div>
              <div className="text-gray-600 mt-2">💰 Comissão por venda</div>
            </div>
            <div className="card-interactive text-center group">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                R$ 79,40
              </div>
              <div className="text-gray-600 mt-2">💎 Por cada indicação</div>
            </div>
            <div className="card-interactive text-center group">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                ∞
              </div>
              <div className="text-gray-600 mt-2">🚀 Ganhos ilimitados</div>
            </div>
          </div>

          <a href="#formulario" className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-10 py-4 rounded-2xl text-lg font-semibold transition-all transform hover:scale-105 shadow-elegant inline-block">
            Quero ser Parceira! 🎉
          </a>
        </div>
      </section>

      
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-12">
            Como Funciona a Parceria
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-elegant text-center p-8 group">
              <div className="h-20 w-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🎫</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Receba seu Cupom</h3>
              <p className="text-gray-600">
                Após aprovação, você recebe um cupom exclusivo personalizado com seu nome 
                para compartilhar com seu público.
              </p>
            </div>

            <div className="card-elegant text-center p-8 group">
              <div className="h-20 w-20 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Compartilhe</h3>
              <p className="text-gray-600">
                Divulgue a CíliosClick nas suas redes sociais, stories, posts ou diretamente 
                com suas clientes usando seu cupom.
              </p>
            </div>

            <div className="card-elegant text-center p-8 group">
              <div className="h-20 w-20 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Receba Comissões</h3>
              <p className="text-gray-600">
                A cada venda realizada com seu cupom, você recebe 20% de comissão. 
                Acompanhe tudo pelo nosso dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-12">
            Por que ser Parceira CíliosClick?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-interactive p-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Produto Inovador</h3>
                  <p className="text-gray-600">
                    Primeira plataforma brasileira de aplicação virtual de cílios com IA. 
                    Seus seguidores vão amar a novidade!
                  </p>
                </div>
              </div>
            </div>

            <div className="card-interactive p-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💎</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Alta Conversão</h3>
                  <p className="text-gray-600">
                    Ferramenta que realmente funciona e agrega valor ao trabalho das profissionais. 
                    Vendas praticamente garantidas!
                  </p>
                </div>
              </div>
            </div>

            <div className="card-interactive p-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Completo</h3>
                  <p className="text-gray-600">
                    Acompanhe suas vendas, comissões e performance em tempo real. 
                    Transparência total nos seus ganhos.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-interactive p-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-rose-100 to-rose-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Público Ideal</h3>
                  <p className="text-gray-600">
                    Perfeito para lashistas, influenciadoras de beleza e profissionais do setor. 
                    Seu público já está interessado!
                  </p>
                </div>
              </div>
            </div>

            <div className="card-interactive p-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sem Investimento</h3>
                  <p className="text-gray-600">
                    Zero custos para se tornar parceira. Apenas compartilhe e ganhe. 
                    Risco zero, lucro garantido!
                  </p>
                </div>
              </div>
            </div>

            <div className="card-interactive p-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🤝</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Suporte Total</h3>
                  <p className="text-gray-600">
                    Materiais de divulgação, suporte técnico e acompanhamento personalizado. 
                    Você não fica sozinha!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-12">
            O que nossas Parceiras dizem
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-elegant p-8">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold text-xl">L</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Lana Santos</h4>
                  <p className="text-gray-600 text-sm">@lanacilios - 15k seguidores</p>
                </div>
              </div>
              <p className="text-gray-700 italic leading-relaxed">
                "Em apenas 2 semanas já faturei mais de R$ 1.500 só indicando a CíliosClick! 
                Minhas clientes amaram a ferramenta e eu amo os ganhos extras! 💰"
              </p>
            </div>

            <div className="card-elegant p-8">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-3xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Marina Lashes</h4>
                  <p className="text-gray-600 text-sm">@marinalashes - 8k seguidores</p>
                </div>
              </div>
              <p className="text-gray-700 italic leading-relaxed">
                "A CíliosClick revolucionou meu atendimento E ainda me dá uma renda extra incrível! 
                Indico de olhos fechados, produto top! ✨"
              </p>
            </div>
          </div>
        </div>
      </section>

      
      <section id="formulario" className="py-16 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600">
        <div className="max-w-2xl mx-auto px-4">
          <div className="card-elegant p-10 shadow-2xl">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
              ✨ Solicite seu Cupom Exclusivo
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Preencha os dados abaixo e entraremos em contato em até 24h
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Nome Completo *
                </label>
                <input type="text" name="nome" required value={formData.nome} onChange={handleInputChange} className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="Seu nome completo"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📧 Email *
                </label>
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="seu@email.com"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📱 WhatsApp *
                </label>
                <input type="tel" name="telefone" required value={formData.telefone} onChange={handleInputChange} className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="(11) 99999-9999"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 Instagram
                </label>
                <input type="text" name="instagram" value={formData.instagram} onChange={handleInputChange} className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="@seuinstagram"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💭 Conte sobre seu público
                </label>
                <textarea name="publico" value={formData.publico} onChange={handleInputChange} rows={4} className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="Ex: Sou lashista há 3 anos, tenho 5k seguidores no Instagram, atendo 50 clientes/mês..."/>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white py-4 rounded-2xl text-lg font-semibold transition-all transform hover:scale-105 shadow-elegant">
                🚀 Enviar Solicitação via WhatsApp
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              ✨ Ao enviar, você concorda em receber contato da equipe CíliosClick
            </p>
          </div>
        </div>
      </section>

      
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl">💄</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                CíliosClick
              </h3>
            </div>
            <p className="text-gray-300 mb-4 text-lg">
              ✨ A primeira plataforma brasileira de aplicação virtual de cílios com inteligência artificial.
            </p>
            <p className="text-gray-400">
              &copy; 2024 CíliosClick. Todos os direitos reservados. 💎
            </p>
          </div>
        </div>
      </footer>
    </div>);
};
export default ParceriasPage;
