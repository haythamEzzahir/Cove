import CoinLogo from '../shared/CoinLogo';

export default function TrendingPanel({ coins = [], onViewAll, onCoinClick }) {
  return (
    <div className="bg-surface border border-default rounded-xl p-4 w-full sm:w-[280px] flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-base font-semibold text-primary">Trending Now</span>
        <button onClick={onViewAll} className="text-xs text-accent bg-transparent border-none cursor-pointer hover:opacity-80">
          View All
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {coins.map((coin, i) => {
          const isPositive = coin.change >= 0;
          return (
            <button
              key={coin.ticker}
              onClick={() => onCoinClick?.({
                name: coin.name,
                ticker: coin.ticker,
                coinId: coin.coinId,
                current_price: parseFloat(coin.price.replace(/[^0-9.-]/g, '')),
                change: coin.change,
                image: coin.image,
              })}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-overlay transition-colors cursor-pointer text-left border-none bg-transparent"
            >
              <div className="flex items-center gap-2.5">
                <CoinLogo ticker={coin.ticker} size={28} image={coin.image} />
                <div>
                  <p className="text-sm font-medium text-primary">{coin.name}</p>
                  <p className="text-xs text-muted">{coin.ticker}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">{coin.price}</p>
                <p className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {isPositive ? '+' : ''}{coin.change}%
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <button className="w-full mt-3 py-2 text-xs font-medium text-accent bg-accent/10 border border-accent/30 rounded-md cursor-pointer hover:opacity-80">
        Explore Markets →
      </button>
    </div>
  );
}