App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:8545',
  chairPerson:null,
  currentAccount:null,
  init: function() {
    $.getJSON('../proposals.json', function(data) {
      var proposalsRow = $('#proposalsRow');
      var proposalTemplate = $('#proposalTemplate');

      for (i = 0; i < data.length; i ++) {
        proposalTemplate.find('.panel-title').text(data[i].name);
        proposalTemplate.find('img').attr('src', data[i].picture);
        proposalTemplate.find('.btn-vote').attr('data-id', data[i].id);

        proposalsRow.append(proposalTemplate.html());
        App.names.push(data[i].name);
      }
    });
    return App.initWeb3();
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    web3.eth.defaultAccount=new Web3(new Web3.providers.HttpProvider(App.url)).eth.accounts[0];
    
    
    App.populateAddress();
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Ballot.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
      App.contracts.Ballot = TruffleContract(data);

    // Set the provider for our contract
      App.contracts.Ballot.setProvider(App.web3Provider);
    
      App.getChairperson();
      App.contracts.Ballot.deployed().then(function(instance){result=instance;});
      
    return App.bindEvents();
  });
  },

  bindEvents: function() {
    jQuery(document).on('click', '.btn-vote', App.handleVote);
    jQuery(document).on('click', '#win-count', App.handleWinner);
    jQuery(document).on('click', '#register', function(){var ad = jQuery('#enter_address').val();App.handleRegister(ad); });
  },

  populateAddress : function(){
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts,function(i){
        if(web3.eth.coinbase != accounts[i]){
          var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
          jQuery('#enter_address').append(optionElement);
        }
      });
    });
  },

  getChairperson : async function(){
    var instance;
    instance= await App.contracts.Ballot.deployed().then(function(i) {return i.chairperson();});
    App.chairPerson=instance;
    console.log(App.chairPerson);
    App.currentAccount = web3.eth.coinbase;
    if(App.chairPerson != App.currentAccount){
       jQuery('#address_div').css('display','none');
       jQuery('#register_div').css('display','none');
       }else{
          jQuery('#address_div').css('display','block');
          jQuery('#register_div').css('display','block');
          }
  },

  handleRegister: async function(addr){
    var voteInstance;
    voteInstance = await App.contracts.Ballot.deployed().then(function(instance){return instance.register(addr);});
    console.log(voteInstance.receipt.status);
  },

  handleVote: async function(event) {
    event.preventDefault();
    var proposalId = parseInt($(event.target).data('id'));
    var vote_fruit;
    var account;
    console.log(proposalId);

    //accounts=new Web3(new Web3.providers.HttpProvider(App.url)).eth.accounts; ricavo tutti gli accounts
    //console.log(web3.eth.coinbase); account corrente metamask
    console.log(web3.eth.coinbase);
    vote_fruit= await App.contracts.Ballot.deployed().then(function(instance) {return instance.vote(proposalId, {from:web3.eth.coinbase })});
    console.log(vote_fruit.receipt.status);

    
    
  },

  handleWinner : function() {
    var voteInstance;
    App.contracts.Ballot.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.winningProposal();
    }).then(function(res){
      alert(App.names[res[0]] + "  is the winner with "+res[1] +" votes");
    }).catch(function(err){
      console.log(err.message);
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
