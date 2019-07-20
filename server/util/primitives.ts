const is_str = (val: string | any) => val && typeof val === 'string';
const is_fn = (val: Function | any) => val && typeof val === 'function';
const is_arr = (val: any[] | any) => val && Array.isArray(val);
const is_str_arr = (val: any[]) => is_arr(val) && val.every(is_str);
const is_fn_arr = (val: any[]) => is_arr(val) && val.every(is_fn);
const is_truthy = (val: any) => Boolean(val);
const filter_out_falsey = (val: any[]) => val.filter(is_truthy);

export {
  is_str,
  is_fn,
  is_arr,
  is_fn_arr,
  is_str_arr,
  is_truthy,
  filter_out_falsey
};
