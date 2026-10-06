export const menu={chicken:{name:'Chicken Bhuna (Boneless) Biryani',price:47,veg:false},mutton:{name:'Dum Gosht (Boneless) Biryani',price:49,veg:false},veg:{name:'Mixed Veg Biryani',price:39,veg:true},paneer:{name:'Paneer Biryani',price:47,veg:true},dessert:{name:'Gulab Jamun',price:5,veg:true}};
export function total(items){return items.reduce((sum,i)=>sum+menu[i.id].price*i.qty,0)}
export function makePlans(people,vegetarians,preferred='chicken'){
 if(!Number.isInteger(people)||people<1||people>10||!Number.isInteger(vegetarians)||vegetarians<0||vegetarians>people)throw new Error('Choose 1–10 diners and a valid vegetarian count');
 const nonveg=people-vegetarians, main=preferred==='mutton'?'mutton':'chicken';
 const basic=[...(nonveg?[{id:main,qty:nonveg}]:[]),...(vegetarians?[{id:'veg',qty:vegetarians}]:[])];
 const alternative=basic.map(i=>({...i}));
 if(nonveg){alternative[0].id=main==='mutton'?'chicken':'mutton'}else{alternative[0].id='paneer'}
 return [{title:'Your table, sorted',items:basic},{title:nonveg?'A different favourite':'The paneer table',items:alternative}];
}
