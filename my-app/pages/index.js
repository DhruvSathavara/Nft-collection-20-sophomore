import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted keeps track of whether the presale has started or not
  const [presaleStarted, setPresaleStarted] = useState(true);
  // checks if the currently connected MetaMask wallet is the owner of the contract
  const [isOwner, setIsOwner] = useState(false);
  // presaleEnded keeps track of whether the presale ended
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);

  const [numTokenMinted, setNumTokenMinted] = useState("");

  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  const presaleMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the presaleMint from the contract, only whitelisted addresses would be able to mint
      const txn = await nftContract.presaleMint({
        // value signifies the cost of one crypto dev which is "0.001" eth.
        // We are parsing `0.001` string to ether using the utils library from ethers.js
        // " utils.parseEther " will convert 0.001 ethers to " wei ".
        value: utils.parseEther("0.001"),
      });
      await txn.wait();

      window.alert("You successfully minted a Presale Cryptodev!!")
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const publicMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the presaleMint from the contract, only whitelisted addresses would be able to mint
      const txn = await nftContract.mint({
        // value signifies the cost of one crypto dev which is "0.001" eth.
        // We are parsing `0.001` string to ether using the utils library from ethers.js
        // " utils.parseEther " will convert 0.001 ethers to " wei ".
        value: utils.parseEther("0.001"),
      });
      await txn.wait();

      window.alert("You successfully minted a Public Cryptodev!!")
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };


  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getOwner = async () => {
    try {

      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the owner function from the contract
      const _owner = await nftContract.owner();

      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      console.log(address, 'user address');
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const getNumOfMintedToken = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const numTokenId = await nftContract.tokenIds();
      setNumTokenMinted(numTokenId.toString());
    } catch (error) {
      console.error(error);
    }
  }

  const startPresale = async () => {
    setLoading(true);
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the startPresale from the contract
      const tx = await nftContract.startPresale();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // set the presale started to true
      setPresaleStarted(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );

      // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      const _presaleEndedTime = await nftContract.presaleEnded();

      // Date.now()/1000 returns the current time in seconds
      const currentTimeInSeconds = Date.now() / 1000;

      const hasPresaleEnded = _presaleEndedTime.lt(
        Math.floor(currentTimeInSeconds)
      );

      setPresaleEnded(hasPresaleEnded);

    } catch (error) {
      console.error(error);
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();

    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumOfMintedToken();

    //Track in real time the number of minted NFTs
    setInterval(async () => {
      await getNumOfMintedToken();
    }, 5 * 1000);

    //Track in real time the status of presale (started, ended or whatever)
    setInterval(async () => {

      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5 * 1000);
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      onPageLoad();

    }
  }, []);

  function renderBody() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your Wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }
    
    if (isOwner && !presaleStarted) {
      // render button to start presale
      return (
        <button onClick={startPresale} className={styles.button}>
          Start PreSale
        </button>
      )
    }

    if (!presaleStarted) {
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet. Come back later !
          </span>
        </div>
      )
    }

    if (presaleStarted && !presaleEnded) {
      // allow users to mint in presale
      //they need to be in whitelist for this to work
      return (
        <div>
          <span className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto
            Dev 🥳
          </span>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      )
    }

    if (presaleEnded) {
      // allow users to take part in public sale 
      return (
        <div>
          <span className={styles.description}>
            Presale has ended!!! You can mint a Crypto dev in public sale, if ant remain.
          </span>
          <button className={styles.button} onClick={publicMint}>
            Public Mint 🚀
          </button>
        </div>
      )
    }



  }

  return (
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}> welcome to Cryptodevs NFT</h1>
          <div className={styles.description}> Its an NFT collection for developers in Crypto. </div>
          <div className={styles.description} >
            {numTokenMinted}/20 have been minted already!
          </div>
          {renderBody()}
        </div>
        <img className={styles.image} src="/cryptodevs/0.svg"></img>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs

      </footer>
    </div>
  )

}