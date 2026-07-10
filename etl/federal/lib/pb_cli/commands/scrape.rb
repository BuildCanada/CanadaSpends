require 'fileutils'
require 'cli/ui'

module PbCli
  module Commands
    class Scrape
      def call(args)
        if args.empty?
          puts "Usage: pb scrape YEARS"
          puts ""
          puts "Examples:"
          puts "  pb scrape 2025              # Scrape single year"
          puts "  pb scrape 2021-2025         # Scrape year range"
          puts "  pb scrape 2015,2017,2019-2025  # Scrape multiple years/ranges"
          return 1
        end

        years = parse_years(args[0])

        if years.empty?
          puts "Error: No valid years specified"
          return 1
        end

        ::CLI::UI::Frame.open("Scraping Public Accounts for #{years.size} year(s)") do
          years.each do |year|
            scrape_year(year)
          end
        end

        puts ""
        puts ::CLI::UI.fmt("{{v}} All downloads complete!")
        puts ""
        print_summary(years)

        0
      end

      private

      def parse_years(year_string)
        years = []

        # Split by comma to handle multiple ranges/years
        parts = year_string.split(',').map(&:strip)

        parts.each do |part|
          if part.include?('-')
            # Handle range: 2021-2025
            start_year, end_year = part.split('-').map(&:to_i)
            years.concat((start_year..end_year).to_a)
          else
            # Handle single year: 2025
            years << part.to_i
          end
        end

        years.uniq.sort
      end

      def scrape_year(year)
        ::CLI::UI::Frame.open("Year #{year}") do
          output_dir = "./raw/#{year}"

          success = download_year(year, output_dir)

          if success
            html_count = count_files(output_dir, "*.html")
            pdf_count = count_files(output_dir, "*.pdf")
            puts ::CLI::UI.fmt("{{v}} Downloaded #{html_count} HTML files, #{pdf_count} PDF files")
          else
            puts ::CLI::UI.fmt("{{x}} Download failed for year #{year}")
          end
        end
      end

      def download_year(year, output_dir)
        # Create output directory
        FileUtils.mkdir_p(output_dir)

        # Change to output directory for wget
        Dir.chdir(output_dir) do
          # Create cookie file
          create_cookie_file

          # Run wget based on year
          result = if year == 2015
            download_2015
          elsif year <= 2021
            download_archived(year)
          elsif year == 2022
            download_2022
          else
            download_recent(year)
          end

          # Clean up cookies
          FileUtils.rm_f('cookies.txt')

          result
        end
      end

      def create_cookie_file
        File.write('cookies.txt', <<~COOKIES)
          # HTTP cookie file for wget
          # This cookie bypasses the disclaimer page on epe.lac-bac.gc.ca
          epe.lac-bac.gc.ca\tFALSE\t/\tFALSE\t0\tdisclaimed\t1
          www.tpsgc-pwgsc.gc.ca\tFALSE\t/\tFALSE\t0\tdisclaimed\t1
          tpsgc-pwgsc.gc.ca\tFALSE\t/\tFALSE\t0\tdisclaimed\t1
        COOKIES
      end

      def download_2015
        base_url = "https://epe.lac-bac.gc.ca/100/201/301/public_accounts_can/html/2015/www.tpsgc-pwgsc.gc.ca/recgen/cpc-pac/2015/index-eng.html"
        domain = "epe.lac-bac.gc.ca"
        accept_regex = "(www\\.tpsgc-pwgsc\\.gc\\.ca/recgen/cpc-pac/2015/.*\\.(html|pdf)|public_accounts_can/html/2015/.*\\.(html|pdf))"

        run_wget(base_url, domain, accept_regex)
      end

      def download_archived(year)
        base_url = "https://epe.lac-bac.gc.ca/100/201/301/public_accounts_can/html/#{year}/recgen/cpc-pac/#{year}/index-eng.html"
        domain = "epe.lac-bac.gc.ca"
        accept_regex = "(recgen/cpc-pac/#{year}/.*\\.(html|pdf)|public_accounts_can/html/#{year}/.*\\.(html|pdf))"

        run_wget(base_url, domain, accept_regex)
      end

      def download_2022
        base_url = "https://webarchiveweb.wayback.bac-lac.canada.ca/web/20230216180145/https://www.tpsgc-pwgsc.gc.ca/recgen/cpc-pac/2022/index-eng.html"
        domain = "webarchiveweb.wayback.bac-lac.canada.ca"
        accept_regex = "(recgen/cpc-pac/2022/.*\\.(html|pdf))"

        run_wget(base_url, domain, accept_regex, no_parent: false)
      end

      def download_recent(year)
        # Try canada.ca first
        base_url_1 = "https://www.canada.ca/en/public-services-procurement/services/payments-accounting/public-accounts/#{year}.html"
        domains_1 = "www.canada.ca,www.tpsgc-pwgsc.gc.ca,tpsgc-pwgsc.gc.ca"
        accept_regex_1 = "(public-accounts/.*\\.(html|pdf)|recgen/cpc-pac/#{year}/.*\\.(html|pdf))"

        success = run_wget(base_url_1, domains_1, accept_regex_1)

        # Then try tpsgc-pwgsc.gc.ca
        base_url_2 = "https://www.tpsgc-pwgsc.gc.ca/recgen/cpc-pac/#{year}/vol1/intro-eng.html"
        accept_regex_2 = "(recgen/cpc-pac/#{year}/.*\\.(html|pdf)|public-accounts/.*\\.(html|pdf))"

        run_wget(base_url_2, domains_1, accept_regex_2) && success
      end

      def run_wget(url, domains, accept_regex, no_parent: true)
        cmd = [
          'wget',
          '--recursive',
          ('--no-parent' if no_parent),
          '--level=5',
          '--adjust-extension',
          '--page-requisites',
          '--wait=0.5',
          '--random-wait',
          "--accept-regex='#{accept_regex}'",
          "--reject-regex='(disclaimer|avis|feedback|retroaction)'",
          '-e', 'robots=off',
          '--load-cookies', 'cookies.txt',
          '--keep-session-cookies',
          '--continue',
          '--span-hosts',
          "--domains='#{domains}'",
          '--no-check-certificate',
          "'#{url}'"
        ].compact.join(' ')

        system(cmd)
      end

      def count_files(dir, pattern)
        return 0 unless Dir.exist?(dir)
        Dir.glob(File.join(dir, '**', pattern)).count
      end

      def print_summary(years)
        puts "Overall summary:"
        puts "----------------"
        years.each do |year|
          dir = "./raw/#{year}"
          if Dir.exist?(dir)
            html_count = count_files(dir, "*.html")
            pdf_count = count_files(dir, "*.pdf")
            puts "Year #{year}: #{html_count} HTML files, #{pdf_count} PDF files"
          else
            puts "Year #{year}: No data downloaded"
          end
        end
      end
    end
  end
end
