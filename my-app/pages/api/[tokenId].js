// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// Base URI + TokenID
// Base URI = https://example.com/
//Token Id = 1

// tokenURI(1) => https://example.com/1

export default function handler (req,res){
    const tokenId = req.query.tokenId;
    
    const name = `Crypto dev dhruv #${tokenId}`;
    const description = "Cryptodev is NFT collection for Web3 developer by double R";
    const image = `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${Number(tokenId) - 1}.svg`;

    return res.json({
        name:name,
        description:description,
        image:image,
    });
}