
import { useAppSelector } from '../store';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    color: 'border-white/10',
    badge: '',
    features: ['Browse movies', 'Basic watchlist (20 movies)', 'Standard quality', 'Ads included'],
    cta: 'Current Plan',
    disabled: true,
    plan: 'free',
  },
  {
    name: 'Pro',
    price: '₹199',
    period: '/month',
    color: 'border-blue-500/50',
    badge: '🔥 Popular',
    features: ['Everything in Free', 'Unlimited watchlist', 'HD quality', 'No ads', 'Priority support'],
    cta: 'Upgrade to Pro',
    disabled: false,
    plan: 'pro',
  },
  {
    name: 'Premium',
    price: '₹499',
    period: '/month',
    color: 'border-amber-500/60',
    badge: '👑 Best Value',
    features: ['Everything in Pro', '4K Ultra HD', 'Early access', 'Download offline', 'Family sharing (5 users)', 'Exclusive content'],
    cta: 'Upgrade to Premium',
    disabled: false,
    plan: 'premium',
  },
];

export default function SubscriptionPage() {
  const user = useAppSelector((state) => state.auth.user);
  const currentPlan = user?.subscriptionPlan ?? 'free';

  const handleUpgrade = (plan: string) => {
    // Phase 15 — Razorpay integration
    console.log('Upgrading to:', plan);
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-5xl mx-auto px-6 py-14">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Choose Your Plan</h1>
          <p className="text-slate-400 text-lg">Unlock the full CineTrack experience</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.plan;
            return (
              <div
                key={p.name}
                className={`relative bg-white/5 border-2 rounded-2xl p-7 flex flex-col transition-all duration-300 hover:scale-[1.02] ${p.color} ${isCurrent ? 'ring-2 ring-amber-500/50' : ''}`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    {p.badge}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ✓ Active
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">{p.name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{p.price}</span>
                    <span className="text-slate-400 text-sm">{p.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrent && !p.disabled && handleUpgrade(p.plan)}
                  disabled={isCurrent || p.disabled}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : p.plan === 'premium'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-95'
                  }`}
                >
                  {isCurrent ? '✓ Current Plan' : p.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            All plans include a 7-day free trial. Cancel anytime. Payments secured by Razorpay.
          </p>
        </div>
      </div>
    </div>
  );
}
