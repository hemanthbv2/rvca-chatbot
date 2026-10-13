<?php
/**
 * Plugin Name: RVCA Institutional AI Chatbot & Telemetry Platform
 * Plugin URI: https://rvca.edu.in
 * Description: Production-grade zero-hallucination institutional AI chatbot and dual-write telemetry engine for RV College of Architecture. Provides client-side NLP, 63-member faculty detective, and deep interaction analytics.
 * Version: 1.0.0
 * Author: Antigravity AI & RVCA IT Services
 * Author URI: https://rvca.edu.in
 * License: Proprietary / Institutional
 * Text Domain: rvca-chatbot
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class RVCA_Institutional_Chatbot {

    public function __construct() {
        // Enqueue assets
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        
        // Register shortcode
        add_shortcode('institution_chatbot', array($this, 'render_chatbot_container'));
        add_shortcode('rvca_chatbot', array($this, 'render_chatbot_container'));
        
        // Admin menu & settings
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // WP REST API Endpoints for Dual-Write Telemetry
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        
        // Auto-inject widget to footer if enabled
        add_action('wp_footer', array($this, 'auto_inject_widget'));
    }

    public function enqueue_assets() {
        $plugin_url = plugin_dir_url(__FILE__);
        $version = '1.0.0';

        // CSS
        wp_enqueue_style('rvca-chatbot-style', $plugin_url . 'chatbot.css', array(), $version);

        // Core Scripts
        wp_enqueue_script('rvca-kb', $plugin_url . 'knowledge-base.js', array(), $version, true);
        wp_enqueue_script('rvca-faculty', $plugin_url . 'faculty-data.js', array(), $version, true);
        wp_enqueue_script('rvca-engine', $plugin_url . 'engine.js', array('rvca-kb', 'rvca-faculty'), $version, true);
        wp_enqueue_script('rvca-telemetry', $plugin_url . 'telemetry.js', array(), $version, true);
        wp_enqueue_script('rvca-chatbot-app', $plugin_url . 'chatbot.js', array('rvca-engine', 'rvca-telemetry'), $version, true);

        // Configuration Localized to window.RVCA_CONFIG
        $vercel_url = get_option('rvca_vercel_url', 'http://localhost:3008');
        $vercel_url = rtrim($vercel_url, '/'); // Ensure no trailing slash per standard
        
        $config = array(
            'wpRestUrl' => esc_url_raw(rest_url('rvca-chatbot/v1')),
            'vercelUrl' => esc_url_raw($vercel_url),
            'institutionId' => 'RVCA-BEN-2026',
            'apiKey' => get_option('rvca_api_key', 'rvca_client_key_2026')
        );

        wp_localize_script('rvca-chatbot-app', 'RVCA_CONFIG', $config);
    }

    public function render_chatbot_container() {
        return '<div id="rvca-chatbot-root"></div>';
    }

    public function auto_inject_widget() {
        $enabled = get_option('rvca_auto_inject', '1');
        if ($enabled === '1') {
            echo '<div id="rvca-chatbot-root"></div>';
        }
    }

    public function add_admin_menu() {
        add_menu_page(
            'RVCA Chatbot Settings',
            'RVCA Chatbot',
            'manage_options',
            'rvca-chatbot-settings',
            array($this, 'render_admin_page'),
            'dashicons-format-chat',
            85
        );
    }

    public function register_settings() {
        register_setting('rvca_chatbot_options', 'rvca_vercel_url');
        register_setting('rvca_chatbot_options', 'rvca_api_key');
        register_setting('rvca_chatbot_options', 'rvca_auto_inject');
    }

    public function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1>RVCA Institutional AI Chatbot & Telemetry Settings</h1>
            <p>Configure dual-write telemetry endpoints, dashboard synchronisation, and client authentication.</p>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('rvca_chatbot_options');
                do_settings_sections('rvca_chatbot_options');
                ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Vercel Backend URL</th>
                        <td>
                            <input type="url" name="rvca_vercel_url" value="<?php echo esc_attr(get_option('rvca_vercel_url', 'http://localhost:3008')); ?>" class="regular-text" placeholder="https://rvca-telemetry.vercel.app" />
                            <p class="description">Enter the Node.js/MongoDB Vercel backend URL <strong>without</strong> the trailing <code>/api</code> slash.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Telemetry API Key</th>
                        <td>
                            <input type="text" name="rvca_api_key" value="<?php echo esc_attr(get_option('rvca_api_key', 'rvca_client_key_2026')); ?>" class="regular-text" />
                            <p class="description">Matching API Key registered on the Node backend dashboard.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Global Auto-Inject Widget</th>
                        <td>
                            <label>
                                <input type="checkbox" name="rvca_auto_inject" value="1" <?php checked(get_option('rvca_auto_inject', '1'), '1'); ?> />
                                Automatically inject chatbot floating button across all pages (or use <code>[institution_chatbot]</code> shortcode).
                            </label>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <hr />
            <h2>System Status & Integration Notes</h2>
            <ul>
                <li><strong>Institution:</strong> RV College of Architecture (RVCA)</li>
                <li><strong>Engine:</strong> Zero-Hallucination Client-Side Levenshtein NLP Engine (74 Benchmark Verified)</li>
                <li><strong>Local REST Endpoint:</strong> <code><?php echo esc_html(rest_url('rvca-chatbot/v1')); ?></code></li>
                <li><strong>Shortcode:</strong> <code>[institution_chatbot]</code> or <code>[rvca_chatbot]</code></li>
            </ul>
        </div>
        <?php
    }

    public function register_rest_routes() {
        register_rest_route('rvca-chatbot/v1', '/telemetry', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_telemetry_post'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('rvca-chatbot/v1', '/lead', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_lead_post'),
            'permission_callback' => '__return_true'
        ));
    }

    public function handle_telemetry_post($request) {
        $params = $request->get_json_params();
        if (empty($params)) {
            return new WP_REST_Response(array('error' => 'Invalid payload'), 400);
        }

        // Store into WordPress options or custom table (Dual-write key standard: timestamp & data)
        $events = get_option('rvca_telemetry_events', array());
        if (!is_array($events)) $events = array();

        $entry = array(
            'timestamp' => current_time('mysql'),
            'data' => $params
        );

        array_unshift($events, $entry);
        if (count($events) > 500) {
            $events = array_slice($events, 0, 500);
        }
        update_option('rvca_telemetry_events', $events, false);

        return new WP_REST_Response(array('success' => true, 'stored' => count($events)), 200);
    }

    public function handle_lead_post($request) {
        $params = $request->get_json_params();
        if (empty($params)) {
            return new WP_REST_Response(array('error' => 'Invalid payload'), 400);
        }

        $leads = get_option('rvca_leads', array());
        if (!is_array($leads)) $leads = array();

        $entry = array(
            'timestamp' => current_time('mysql'),
            'data' => $params
        );

        array_unshift($leads, $entry);
        update_option('rvca_leads', $leads, false);

        return new WP_REST_Response(array('success' => true, 'stored' => count($leads)), 200);
    }
}

new RVCA_Institutional_Chatbot();
