import { supabase } from "../../lib/supabase";

export default class Model {
  async signUp(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      console.error(error);
    }
    console.log(data);
  }

  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error(error);
    }
    console.log(data);
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
  }

  async getUser(): Promise<string | undefined> {
    const { data } = await supabase.auth.getUser();
    return data.user?.email;
  }
}
