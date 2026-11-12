(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BookMotion=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  // Integrate a gently curved sheet from the spine to the outside edge.
  function paper(progress,direction,width,count=10){
    const step=width/count,bend=Math.sin(Math.PI*progress)*.46;
    let x=0,z=0;
    return Array.from({length:count},(_,i)=>{
      const angle=-direction*Math.PI*progress+direction*bend*(i/(count-1)-.45);
      const pose={x:direction===1?x:width-x-step,z,angle:angle*180/Math.PI,shade:Math.abs(Math.sin(angle))*.22};
      x+=Math.cos(angle)*step;z+=-direction*Math.sin(angle)*step;
      return pose;
    });
  }
  const progress=(dx,direction,width)=>clamp(-dx*direction/Math.max(width,1),0,1);
  const commit=(dx,direction,width,velocity=0)=>-dx*direction>0&&(progress(dx,direction,width)>=.2||(-dx*direction>=32&&-velocity*direction>.35));
  return {clamp,paper,progress,commit};
});
