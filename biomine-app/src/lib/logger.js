import { supabase } from "./supabase";

/**
 * Client-side logging utility that streams issues into the DB `system_logs` table
 */
class Logger {
  /**
   * Log an event or error to the database
   * @param {string} level - 'info' | 'warning' | 'error' | 'security'
   * @param {string} module - Component or page name
   * @param {string} message - Description of the log
   * @param {string} [stack] - Optional error stack
   */
  async log(level, module, message, stack = null) {
    console[level === 'error' ? 'error' : 'log'](`[${module}] ${message}`, stack || "");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      await supabase.from("system_logs").insert([
        {
          log_level: level,
          module: module,
          message: message,
          error_stack: stack,
          user_id: userId
        }
      ]);
    } catch (err) {
      console.warn("[Logger Failure] Could not persist log to database", err);
    }
  }

  info(module, message) {
    this.log('info', module, message);
  }

  warn(module, message) {
    this.log('warning', module, message);
  }

  error(module, message, stack) {
    this.log('error', module, message, stack);
  }

  security(module, message) {
    this.log('security', module, message);
  }
}

export const logger = new Logger();
