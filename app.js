const express=require('express');
const bodyParser = require('body-parser')
const app=express();
app.use(express.json());
const path= require("path"); 
const ejs= require("ejs");
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));
const puppeteer=require('puppeteer');
const amazonUrl='https://www.amazon.in/';
const flipkartUrl='https://www.flipkart.com/'
const AmazonpriceArr=[];
const FlipkartpriceArr=[];
const result=[];
let minmPrice=Infinity;
let renderLink='#';
let bobj;
const port=process.env.PORT||8000;
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.get('/',(req,res)=>{
    //res.sendFile('/public/index.html',{root:__dirname});
    res.render('index.ejs');
    

})
app.post('/',async(req,res)=>{
    //console.log(req.body);
    let mobilename=req.body.mobileName;
    console.log(mobilename);
    await getPriceFromFlipkart(mobilename);
    result.forEach(element => {
        if(Number(element.price) < minmPrice){
            minmPrice=element.price;
            renderLink=element.url;
        }
        
    });
    // console.log(`minimum price is ${minmPrice} and link is ${renderLink}`);
    // res.json({
    //     status:'success',
    //     statusCode:200,
    //     price:minmPrice,
    //     link:renderLink
    // });

    res.render('new.ejs',{price:minmPrice,link:renderLink});
    bobj.close({delay:6000});
})


async  function getPriceFromFlipkart(name){
     try {
          bobj=await puppeteer.launch(
        //     {
        //     headless:false,
        //     defaultViewport:null,
        //     args:['--start-maximized']
        //    }
        );
        const newpage=await bobj.newPage();
        await newpage.goto(flipkartUrl);
        await newpage.waitForSelector('button._2KpZ6l._2doB4z');
        await newpage.click('._2KpZ6l._2doB4z');
        await newpage.waitForSelector('._3704LK');
        await newpage.type("._3704LK",name); 
        await newpage.click('button.L0Z3Pu')
        await newpage.waitForSelector('._4rR01T');
        const nameArr1 = await newpage.evaluate(() =>
        Array.from(
            document.querySelectorAll('._4rR01T'),
            (element) => element.textContent,
            
        ))
        const priceArr1 = await newpage.evaluate(() =>
        Array.from(
            document.querySelectorAll('._30jeq3._1_WHN1'),
            (element) => element.textContent.slice(1)
        ))
        await extractName_price(nameArr1,priceArr1,FlipkartpriceArr);
        //console.log(FlipkartpriceArr);
        await matchPrice(name,flipkartUrl,FlipkartpriceArr,result);
        const newpage1=await bobj.newPage();
        await getPriceFromAmazon(newpage1,name);
     } catch (error) {
        console.log(error);
     }
}
async function getPriceFromAmazon(newpage,name){
    try {
        await newpage.goto(amazonUrl);
        await newpage.waitForSelector('#twotabsearchtextbox');
        await newpage.type("#twotabsearchtextbox",name); 
        await newpage.waitForSelector('#nav-search-submit-button');
        await newpage.click('#nav-search-submit-button')
        await newpage.waitForSelector('span.a-size-medium.a-color-base.a-text-normal')
        //const elename=await newpage.$('span.a-size-medium.a-color-base.a-text-normal'); for single element
        //const nameArr = await newpage.evaluate(el => el.textContent, elename) // get single text
        const nameArr = await newpage.evaluate(() =>
        Array.from(
            document.querySelectorAll('span.a-size-medium.a-color-base.a-text-normal'),
            (element) => element.textContent,
            
        ))
        const priceArr = await newpage.evaluate(() =>
        Array.from(
            document.querySelectorAll('span.a-price-whole'),
            (element) => element.textContent
        ))
        await extractName_price(nameArr,priceArr,AmazonpriceArr);
        //console.log(AmazonpriceArr);
        await matchPrice(name,amazonUrl,AmazonpriceArr,result);
    } catch (error) {
        console.log(error);
    }
     
}

async function extractName_price(nameArr,priceArr,db){
    for(let s in nameArr){
        let text = "";
        for(let member in nameArr[s]) {
            if(nameArr[s][member]=='('){
                break;
            }
            else{
                text+=nameArr[s][member];
            }
        }
        db.push({
            name:text,
            price:priceArr[s]
        })
    }
}

async function matchPrice(name,siteUrl,array,result){
    let flag=0;
    let s1=name.toUpperCase();
    array.forEach(element => {
        let s2=element.name.toUpperCase();
        let check= s1==s2;
        if(flag==0 && !check){
            let p1=""; 
            const myarr=element.price.split(',');
            myarr.forEach(ele=>{p1+=ele});
            name=element.name;
            //console.log(`${name}:${p1}`);
            result.push({
                mobileName:name,
                price:p1,
                url:siteUrl
            })
            flag=1;
        }
    });
    if(flag==0)console.log('no match found');
}

app.listen(port,(req,res)=>{
    console.log(`listening to ${port}`);
})