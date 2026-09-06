

const newWatchPrice = [


      {
            name: "Casio AE-1200WHD 1AV",
            tag: "black frame, silver case, silver strap",
            baseName: "AE-1200",
            basePrice: 3995,
        },
        {
            name: "Casio AE-1200WH 1AV",
            tag: "black frame, black case, black strap",
            baseName: "AE-1200",
            basePrice: 2995,
        },
    
        {
            name: "Casio AE-1200WH 1CVCF",
            tag: "black frame, silver case, black strap",
            baseName: "AE-1200",
            basePrice: 4500,
        },
        {
            name: "Casio AE-1200WH 1CVCF",
            tag: "black frame, silver case, orange strap",
            baseName: "AE-1200",
            basePrice: 4500,
        },
    
    
        {
            name: "Casio F91 Blue",
            tag: "blue frame, blue case, blue strap",
            baseName: "Casio F91",
            basePrice: 1695,
        },
        {
            name: "Casio F91 White",
            tag: "white frame, white case, white strap",
            baseName: "Casio F91",
            basePrice: 1695,
        },
        {
            name: "Casio F91 Black",
            tag: "black frame, black case, black strap",
            baseName: "Casio F91",
            basePrice: 1295,
        },

        {
            name: "Casio A158WA-1",
            tag: "black frame, black case, black strap",
            baseName: "Casio F91",
            basePrice: 1895,
        }

]


const watchToShowOnWebsite = [


    {
          name: "Casio AE-1200WHD 1AV",
          tag: "black frame, silver case, silver strap",
          baseName: "AE-1200",
          basePrice: 3995,
          mod:["customPicturesTransparent"],
          islisted:true
      },

      {
        name: "Casio AE-1200WHD 1AV",
        tag: "black frame, silver case, silver strap",
        baseName: "AE-1200",
        basePrice: 3995,
        mod:["one color"],
        islisted:true
    },
      {
          name: "Casio AE-1200WH 1AV",
          tag: "black frame, black case, black strap",
          baseName: "AE-1200",
          basePrice: 2995,
          mod:[],
          islisted:false
      },
  
      {
          name: "Casio AE-1200WH 1CVCF",
          tag: "black frame, silver case, black strap",
          baseName: "AE-1200",
          basePrice: 4500,
          mod:["three color"],
          islisted:true
      },
      {
          name: "Casio AE-1200WH 1CVCF",
          tag: "black frame, silver case, orange strap",
          baseName: "AE-1200",
          basePrice: 4500,
          mod:["three color" , "rubber strap","orange"],
          islisted:true


      },
  
  
      {
          name: "Casio F91 Blue",
          tag: "blue frame, blue case, blue strap",
          baseName: "Casio F91",
          basePrice: 1695,
          mod:["customPictures"],
          islisted:true
      },
      {
          name: "Casio F91 White",
          tag: "white frame, white case, white strap",
          baseName: "Casio F91",
          basePrice: 1695,
          mod:[""],
          islisted:false

      },
      {
          name: "Casio F91 Black",
          tag: "black frame, black case, black strap",
          baseName: "Casio F91",
          basePrice: 1295,
          mod:[""],
          islisted:false
      },

      {
          name: "Casio A158WA-1",
          tag: "black frame, black case, black strap , naruto picture",
          baseName: "Casio F91",
          basePrice: 1895,
          mod:["customPictures"],
          islisted:true
      },

      {
        name: "Casio A158WA-1",
        tag: "black frame, black case, black strap, green color filter",
        baseName: "Casio F91",
        basePrice: 1895,
        mod:["one color"],
        islisted:true
    },

    {
        displayName: "Casio DW-291H",
        tag: "black frame, black case, black strap, red color filter",
        baseName: "DW-291H",
        basePrice: 3595,
        mod:["one color"],
        inStock: true,
      },

]


const straps = [ 
    {
        name:"rubber strap",
        color:["orange"],
        price:200,
       },
]


const colorFilterPrices = [ 
    
     {
      name:"one color",
      price:1000,
     },
     {
        name:"two color",
        price:1500,
    },
    {
        name:"three color",
        price:2000,
    },
    {
        name:"four color",
        price:2000,
    }

]

const customFilterswithPictures = [

    {
     name:"customPicturesTransparent",
     price:2000
    }
]

const customPictures =[
    {
    name:"customPictures",
     price:1000
    }
]

const customFacePlate =[
    {
    name:"customFacePlateF91_A158",
     price:2000
    }
]