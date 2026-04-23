import { creatContext, use } from 'react';

const CoinContext = creatContext();

const CoinContextProvider = (props) => {
    const [allcoins, setAllCoins] = useState([]);
    const [currency, setCurrency] = useState({
        name: 'USD',
        symbol: '$',
    });

  const fetchCoins = async () => {
    try {
        const res = await fetch("http://localhost:5000/coins");
        const data = await res.json();
        setAllCoins(data); 
    } catch (err) {
        console.error(err);
    }
};
useEffect(() => {
    fetchCoins();
}, [currency]);

    const contextValue = { allcoins, setAllCoins, currency, setCurrency, fetchCoins };
    return (
        <CoinContext.Provider value={contextValue}>
            {props.children}
        </CoinContext.Provider>
    )
}
export default CoinContextProvider;