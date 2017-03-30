require("@ecmal/runtime");
System.import("@vendor/project").catch(
    e=>console.info(e.stack||e)
);